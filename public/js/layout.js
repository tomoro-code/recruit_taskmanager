const button = document.getElementsByTagName('button');

for(let i = 0; i < button.length; i++){
    button[i].addEventListener('mouseenter', (e) => {
        e.target.classList.add('mouseover');
    });
    button[i].addEventListener('mouseleave', (e) => {
        e.target.classList.remove('mouseover');
    });
}


const dropdownTrigger = document.getElementById('dropdownTrigger');
const dropdown = document.getElementById('dropdown');
let isOpened = false;

if(dropdownTrigger){
    dropdownTrigger.addEventListener('click', () => {
        if(isOpened){
            dropdown.classList.remove('open');
            dropdown.classList.add('close');
            isOpened = false;
        }else{
            dropdown.classList.remove('close');
            dropdown.classList.add('open');
            isOpened = true;
        }
    });
}
