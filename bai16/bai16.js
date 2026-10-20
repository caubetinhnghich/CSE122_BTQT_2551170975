const input = document.getElementById("input");
const list = document.getElementById("list");
const count = document.getElementById("count");

function themViec(text, daXong) {
  const li = document.createElement("li");
  if (daXong) li.classList.add("done");

  const cb = document.createElement("input");
  cb.type = "checkbox";
  cb.checked = daXong;

  const span = document.createElement("span");
  span.textContent = text;

  const btn = document.createElement("button");
  btn.className = "xoa";
  btn.textContent = "Xoá";

  function doiTrangThai() {
    li.classList.toggle("done", cb.checked);
    capNhatDem();
  }
  cb.addEventListener("change", doiTrangThai);
  span.addEventListener("click", function () {
    cb.checked = !cb.checked;
    doiTrangThai();
  });

  btn.addEventListener("click", function () {
    li.remove();
    capNhatDem();
  });

  li.append(cb, span, btn);
  list.appendChild(li);
  capNhatDem();
}

function capNhatDem() {
  const conLai = list.querySelectorAll("li:not(.done)").length;
  count.textContent = "Còn " + conLai + " việc chưa hoàn thành";
}

function xuLyThem() {
  const text = input.value.trim();
  if (text === "") return;
  themViec(text, false);
  input.value = "";
  input.focus();
}
document.getElementById("btnThem").addEventListener("click", xuLyThem);
input.addEventListener("keydown", function (e) {
  if (e.key === "Enter") xuLyThem();
});

themViec("Đọc chương HTML5 cơ bản", true);
themViec("Làm bài tập CSS Grid", false);
themViec("Quay video OBS nộp bài", false);