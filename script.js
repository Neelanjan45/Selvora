async function loadComponents() {
    const navbar = await fetch('components/navbar.html');
    const footer = await fetch('components/footer.html');

    document.getElementById('navbar-container').innerHTML = await navbar.text();
    document.getElementById('footer-container').innerHTML = await footer.text();
}

loadComponents();

// Order Form Start
function calcPrice() {

    let quantity = Number(document.getElementById("prod_quantity").value)
    let price = document.getElementById("prod_base_price").value.split(' ')
    
    price[1] = quantity * Number(price[1])
    
    price = price.join(' ')
    document.getElementById('total_price').value = price
}

const orderSubmit = document.getElementById('order_form_body');

orderSubmit.addEventListener(
    'submit',

    async function (e) {
        e.preventDefault();
        
        if (!orderSubmit.checkValidity()) {
            orderSubmit.reportValidity();
            return;
        }

        const price = document.getElementById('total_price').value.split(' ')[1]
        
        let address = document.getElementById('adrs_line_one').value + ', ' + document.getElementById('adrs_line_two').value + ', ' + document.getElementById('adrs_city').value + ', ' + document.getElementById('adrs_district').value + ', ' + document.getElementById('adrs_pin').value + ', ' + document.getElementById('adrs_state').value
        
        const formData = {
            cust_name: document.getElementById('cust_name').value,
            cust_email: document.getElementById('cust_email').value,
            cust_contact: document.getElementById('cust_contact').value,
            prod_name: document.getElementById('prod_name').value,
            prod_quantity: document.getElementById('prod_quantity').value,
            prod_base_price: document.getElementById('prod_base_price').value.split(' ')[1],
            total_price: price,
            ship_address: address
        };
        
        console.log(formData);
        
        await fetch (
            "https://script.google.com/macros/s/AKfycbzHBACfu6o3_tlCw3IKhL7su8WzN1keE8Q_m7tmi9pguMLTFHsMDEUhJlNm3kwyVYL2/exec",
        
            {
                method: "POST",
                mode:"no-cors",
                body: JSON.stringify(formData)
            }
        );
        
        alert("Order submitted successfully.");

        location.reload();
    }
);
// Order Form End

// Product Details Tab Start
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
// Product Details Tab End
