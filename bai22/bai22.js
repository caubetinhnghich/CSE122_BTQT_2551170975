const nutGat = document.getElementById("nutgat");
const ghiChu = document.getElementById("ghichu");

nutGat.addEventListener("click", function(){
    document.body.classList.toggle("toi");
    nutGat.classList.toggle("bat");

    if(document.body.classList.contains("toi")){
        ghiChu.textContent = "Đây là giao diện ở chế độ TỐI (đang bật).";
    }
    else{
        ghiChu.textContent = "Đây là giao diện ở chế độ SÁNG (đang tắt chế độ tối).";

    }
});