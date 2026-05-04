import { 
    db, collection, addDoc, getDocs, getDoc, doc, updateDoc, deleteDoc, query, orderBy, arrayUnion 
} from "./firebase-config.js";

const postList = document.getElementById('postList');
const writeModal = document.getElementById('writeModal');
const viewModal = document.getElementById('viewModal');
const postForm = document.getElementById('postForm');
const commentForm = document.getElementById('commentForm');

let currentPostId = null;

// --- 데모 모드 (Firebase 미설정 시 localStorage 사용) ---
const isFirebaseConfigured = () => {
    return typeof db !== 'undefined' && db !== null;
};

const getLocalPosts = () => JSON.parse(localStorage.getItem('robot_posts') || '[]');
const saveLocalPosts = (posts) => localStorage.setItem('robot_posts', JSON.stringify(posts));
// ---------------------------------------------------

// 공통: 모달 닫기
const closeModal = (modal) => {
    modal.style.display = 'none';
};

// 공통: 모달 열기
const openModal = (modal) => {
    modal.style.display = 'flex';
};

// 1. 게시글 목록 불러오기
async function loadPosts() {
    postList.innerHTML = '<tr><td colspan="4" style="text-align:center;">불러오는 중...</td></tr>';
    
    let posts = [];
    if (isFirebaseConfigured()) {
        const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));
        const querySnapshot = await getDocs(q);
        querySnapshot.forEach(doc => posts.push({ id: doc.id, ...doc.data() }));
    } else {
        console.warn("Firebase가 설정되지 않아 데모 모드(localStorage)로 동작합니다.");
        posts = getLocalPosts().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    postList.innerHTML = '';
    let index = posts.length;

    posts.forEach((data) => {
        const dateStr = data.createdAt?.seconds 
            ? new Date(data.createdAt.seconds * 1000).toLocaleDateString() 
            : new Date(data.createdAt).toLocaleDateString();
        
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${index--}</td>
            <td><a href="#" class="post-link" data-id="${data.id}">${data.title}</a></td>
            <td>${data.author}</td>
            <td>${dateStr}</td>
        `;
        postList.appendChild(tr);
    });

    document.querySelectorAll('.post-link').forEach(link => {
        link.onclick = (e) => {
            e.preventDefault();
            viewPost(e.target.dataset.id);
        };
    });
}

// 2. 글쓰기 / 수정 저장
postForm.onsubmit = async (e) => {
    e.preventDefault();
    const id = document.getElementById('postId').value;
    const title = document.getElementById('title').value;
    const author = document.getElementById('author').value;
    const content = document.getElementById('content').value;

    const postData = {
        title,
        author,
        content,
        updatedAt: new Date().toISOString()
    };

    try {
        if (isFirebaseConfigured()) {
            if (id) {
                await updateDoc(doc(db, "posts", id), postData);
            } else {
                postData.createdAt = new Date();
                postData.comments = [];
                await addDoc(collection(db, "posts"), postData);
            }
        } else {
            let posts = getLocalPosts();
            if (id) {
                const idx = posts.findIndex(p => p.id === id);
                posts[idx] = { ...posts[idx], ...postData };
            } else {
                const newPost = { 
                    id: Date.now().toString(), 
                    ...postData, 
                    createdAt: new Date().toISOString(),
                    comments: [] 
                };
                posts.push(newPost);
            }
            saveLocalPosts(posts);
        }
        
        alert(id ? '수정되었습니다.' : '등록되었습니다.');
        closeModal(writeModal);
        postForm.reset();
        loadPosts();
    } catch (err) {
        console.error(err);
        alert('저장에 실패했습니다.');
    }
};

// 3. 상세 보기
async function viewPost(id) {
    currentPostId = id;
    let data;

    if (isFirebaseConfigured()) {
        const docRef = doc(db, "posts", id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) data = docSnap.data();
    } else {
        data = getLocalPosts().find(p => p.id === id);
    }

    if (data) {
        const dateStr = data.createdAt?.seconds 
            ? new Date(data.createdAt.seconds * 1000).toLocaleString() 
            : new Date(data.createdAt).toLocaleString();

        document.getElementById('viewTitle').innerText = data.title;
        document.getElementById('viewAuthor').innerText = data.author;
        document.getElementById('viewDate').innerText = dateStr;
        document.getElementById('viewContent').innerText = data.content;

        renderComments(data.comments || []);
        openModal(viewModal);
    }
}

// 4. 삭제
document.getElementById('btnDelete').onclick = async () => {
    if (confirm('정말로 삭제하시겠습니까?')) {
        if (isFirebaseConfigured()) {
            await deleteDoc(doc(db, "posts", currentPostId));
        } else {
            let posts = getLocalPosts().filter(p => p.id !== currentPostId);
            saveLocalPosts(posts);
        }
        alert('삭제되었습니다.');
        closeModal(viewModal);
        loadPosts();
    }
};

// 5. 수정 모드로 전환
document.getElementById('btnEdit').onclick = async () => {
    let data;
    if (isFirebaseConfigured()) {
        const docSnap = await getDoc(doc(db, "posts", currentPostId));
        data = docSnap.data();
    } else {
        data = getLocalPosts().find(p => p.id === currentPostId);
    }

    document.getElementById('postId').value = currentPostId;
    document.getElementById('title').value = data.title;
    document.getElementById('author').value = data.author;
    document.getElementById('content').value = data.content;
    document.getElementById('modalTitle').innerText = '게시글 수정';

    closeModal(viewModal);
    openModal(writeModal);
};

// 6. 댓글 등록
commentForm.onsubmit = async (e) => {
    e.preventDefault();
    const author = document.getElementById('commentAuthor').value;
    const text = document.getElementById('commentText').value;

    const newComment = {
        author,
        text,
        createdAt: new Date().toISOString()
    };

    try {
        if (isFirebaseConfigured()) {
            await updateDoc(doc(db, "posts", currentPostId), {
                comments: arrayUnion(newComment)
            });
        } else {
            let posts = getLocalPosts();
            const idx = posts.findIndex(p => p.id === currentPostId);
            posts[idx].comments.push(newComment);
            saveLocalPosts(posts);
        }
        commentForm.reset();
        viewPost(currentPostId);
    } catch (err) {
        console.error(err);
        alert('댓글 등록에 실패했습니다.');
    }
};

function renderComments(comments) {
    const commentList = document.getElementById('commentList');
    commentList.innerHTML = '';
    comments.forEach(c => {
        const div = document.createElement('div');
        div.className = 'comment';
        div.innerHTML = `
            <div class="comment-meta">${c.author}</div>
            <div class="comment-text">${c.text}</div>
        `;
        commentList.appendChild(div);
    });
}

document.getElementById('btnWrite').onclick = () => {
    document.getElementById('postId').value = '';
    postForm.reset();
    document.getElementById('modalTitle').innerText = '게시글 작성';
    
    // 현재 시간 표시
    const now = new Date();
    document.getElementById('currentTimeDisplay').innerText = now.toLocaleString('ko-KR', {
        year: 'numeric', month: 'long', day: 'numeric', 
        hour: '2-digit', minute: '2-digit'
    });

    openModal(writeModal);
};

document.getElementById('btnCancelWrite').onclick = () => closeModal(writeModal);
document.getElementById('btnCloseView').onclick = () => closeModal(viewModal);

loadPosts();
