document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('clientForm');

    form.addEventListener('submit', function(event) {
        event.preventDefault();
        
        const formData = new FormData(form);
        const data = {};
        
        formData.forEach((value, key) => {
            data[key] = value;
        });
        
        console.log(data);
        
        // You can add additional logic here to handle the data,
        // such as sending it to a server or displaying a confirmation message.
    });
});
