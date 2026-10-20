var bieuThuc = "";     
var daTinh = false;   

function hienThi(tren, duoi) {
  document.getElementById("bieuthuc").innerHTML = tren;
  document.getElementById("ketqua").innerHTML = duoi;
}

function themDongMo() {
  var mo  = bieuThuc.split("(").length - 1; 
  var dong = bieuThuc.split(")").length - 1;
  var cuoi = bieuThuc.charAt(bieuThuc.length - 1);
  var cuoiLaSo = (cuoi >= "0" && cuoi <= "9") || cuoi == ")" || cuoi == "%";

  if (mo > dong && cuoiLaSo) bieuThuc += ")";
  else bieuThuc += "(";
}

function tinh() {
  var s = bieuThuc;
  s = s.replace(/x/g, "*").replace(/÷/g, "/").replace(/-/g, "-");
  s = s.replace(/%/g, "/100");
  try {
    var kq = eval(s);
    if (kq === undefined || !isFinite(kq)) throw "loi";
    kq = Math.round(kq * 1e10) / 1e10;   
    hienThi(bieuThuc, kq);
    bieuThuc = String(kq);
    daTinh = true;
  } catch (e) {
    hienThi(bieuThuc, "Lỗi");
    bieuThuc = "";
  }
}

function bam() {
  var k = this.innerHTML;
  var laChuSo = (k >= "0" && k <= "9") || k == ".";

  if (k == "C") {
    bieuThuc = "";
    daTinh = false;
    hienThi("", "0");
    return;
  }

  if (k == "=") {
    if (bieuThuc != "") tinh();
    return;
  }

  
  if (daTinh && laChuSo) bieuThuc = "";
  daTinh = false;

  if (k == "( )") themDongMo();
  else bieuThuc += k;

  hienThi("", bieuThuc);
}

var cacNut = document.getElementsByClassName("nut");
for (var i = 0; i < cacNut.length; i++) {
  cacNut[i].addEventListener("click", bam);
}