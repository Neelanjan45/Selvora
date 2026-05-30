async function loadComponents() {
    const navbar = await fetch('components/navbar.html');
    const footer = await fetch('components/footer.html');

    document.getElementById('navbar-container').innerHTML = await navbar.text();
    document.getElementById('footer-container').innerHTML = await footer.text();
}

loadComponents();

const buttons =
document.querySelectorAll(".prod_desc_btn");

const contents =
document.querySelectorAll(".prod_desc_content");

buttons.forEach(button=>{

    button.addEventListener("click",()=>{

        buttons.forEach(btn=>
            btn.classList.remove("active")
        );

        contents.forEach(content=>
            content.classList.remove("active")
        );

        button.classList.add("active");

        document
            .getElementById(
                button.dataset.tab
            )
            .classList
            .add("active");

    });

});
