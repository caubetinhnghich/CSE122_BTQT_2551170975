
function doiSo(so, idChuc, idDonVi) {
  var chuc   = Math.floor(so / 10);
  var donvi  = so % 10;
  document.getElementById(idChuc).src  = "0" + chuc  + ".gif";
  document.getElementById(idDonVi).src = "0" + donvi + ".gif";
}

function chayDongHo() {
  var d = new Date();
  var gio  = d.getHours();
  var phut = d.getMinutes();
  var giay = d.getSeconds();

  doiSo(gio,  "h1", "h2");
  doiSo(phut, "m1", "m2");
  doiSo(giay, "s1", "s2");

  var chao;
  if (gio < 11)      chao = "Chào buổi sáng";
  else if (gio < 13) chao = "Chào buổi trưa";
  else if (gio < 18) chao = "Chào buổi chiều";
  else               chao = "Chào buổi tối";
  document.getElementById("loichao").innerHTML = chao;
}

chayDongHo();                   
setInterval(chayDongHo, 1000); 