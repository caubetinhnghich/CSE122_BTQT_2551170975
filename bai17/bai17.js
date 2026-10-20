const form = document.getElementById("form");
const hoten = document.getElementById("hoten");
const email = document.getElementById("email");
const matkhau = document.getElementById("matkhau");
const xacnhan = document.getElementById("xacnhan");

function hienKetQua(o, loi) {
  const msg = document.getElementById("msg-" + o.id);
  if (loi) {
    o.className = "loi";
    msg.className = "msg loi";
    msg.textContent = "✗ " + loi;
    return false;
  }
  o.className = "hople";
  msg.className = "msg hople";
  msg.textContent = "✓ Hợp lệ";
  return true;
}

function kiemTraHoTen() {
  const loi = hoten.value.trim() === "" ? "Họ tên không được để trống" : "";
  return hienKetQua(hoten, loi);
}

function kiemTraEmail() {
  const mau = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const loi = mau.test(email.value.trim()) ? "" : "Email không hợp lệ (thiếu tên miền)";
  return hienKetQua(email, loi);
}

function kiemTraMatKhau() {
  const loi = matkhau.value.length >= 6 ? "" : "Mật khẩu phải có ít nhất 6 ký tự";
  return hienKetQua(matkhau, loi);
}

function kiemTraXacNhan() {
  const loi = (xacnhan.value !== "" && xacnhan.value === matkhau.value)
    ? "" : "Mật khẩu xác nhận không khớp";
  return hienKetQua(xacnhan, loi);
}

hoten.addEventListener("input", kiemTraHoTen);
email.addEventListener("input", kiemTraEmail);
matkhau.addEventListener("input", function () {
  kiemTraMatKhau();
  if (xacnhan.value !== "") kiemTraXacNhan();
});
xacnhan.addEventListener("input", kiemTraXacNhan);

form.addEventListener("submit", function (e) {
  e.preventDefault();
  const a = kiemTraHoTen();
  const b = kiemTraEmail();
  const c = kiemTraMatKhau();
  const d = kiemTraXacNhan();
  if (a && b && c && d) {
    alert("Đăng ký thành công!");
    form.reset();
    [hoten, email, matkhau, xacnhan].forEach(function (o) {
      o.className = "";
      document.getElementById("msg-" + o.id).textContent = "";
    });
  }
});