// ✅ Firebase 配置（使用你的 Firebase 项目配置）
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT_ID.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
};

// ✅ 初始化 Firebase
firebase.initializeApp(firebaseConfig);
const storage = firebase.storage();
const db = firebase.firestore();
const auth = firebase.auth();  // 如果你想启用用户身份验证

// ✅ 上传文件
function uploadFile() {
    const fileInput = document.getElementById("fileInput");
    const titleInput = document.getElementById("photoTitle");
    const authorInput = document.getElementById("authorName");

    const file = fileInput.files[0];
    const title = titleInput.value.trim();
    const author = authorInput.value.trim();

    if (!file || title === "" || author === "") {
        alert("Please fill in all fields and select a file!");
        return;
    }

    // 🔹 生成唯一的文件名，避免覆盖
    const fileName = `${Date.now()}_${file.name}`;
    const storageRef = storage.ref("images/" + fileName);

    storageRef.put(file).then(snapshot => {
        snapshot.ref.getDownloadURL().then(url => {
            saveToDatabase(url, title, author, fileName);
        });
    });
}

// ✅ 将数据保存到 Firestore
function saveToDatabase(url, title, author, fileName) {
    db.collection("photos").add({
        imageUrl: url,
        title: title,
        author: author,
        fileName: fileName,  // 需要保存文件名，以便删除时找到对应的文件
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
    }).then(() => {
        alert("Photo uploaded successfully!");
        loadGallery();
    });
}

// ✅ 读取 Firestore 数据并显示图库
function loadGallery() {
    const gallery = document.getElementById("gallery");
    gallery.innerHTML = ""; // 清空已有内容

    db.collection("photos").orderBy("timestamp", "desc").get().then(snapshot => {
        snapshot.forEach(doc => {
            const data = doc.data();
            const photoDiv = document.createElement("div");
            photoDiv.classList.add("photo-card");

            photoDiv.innerHTML = `
                <img src="${data.imageUrl}" alt="${data.title}">
                <h3>${data.title}</h3>
                <p>By ${data.author}</p>
                <button onclick="deleteImage('${data.imageUrl}', '${doc.id}', '${data.fileName}')">Delete</button>
            `;

            gallery.appendChild(photoDiv);
        });
    });
}

// ✅ 删除图片
function deleteImage(imageUrl, docId, fileName) {
    if (!confirm("Are you sure you want to delete this photo?")) return;

    const storageRef = storage.ref("images/" + fileName);

    // 🔹 删除存储中的图片
    storageRef.delete().then(() => {
        console.log("Image deleted from Storage");

        // 🔹 删除 Firestore 记录
        db.collection("photos").doc(docId).delete().then(() => {
            alert("Photo deleted successfully!");
            loadGallery(); // 重新加载图库
        }).catch(error => {
            console.error("Error deleting document: ", error);
        });

    }).catch(error => {
        console.error("Error deleting file: ", error);
    });
}

// ✅ 页面加载时显示图库
window.onload = loadGallery;
