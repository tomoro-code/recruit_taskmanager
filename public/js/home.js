const boxElements = document.getElementsByClassName('entry_company');

console.log(boxElements + boxElements[0]);

for(let i = 0; i < boxElements.length; i++){
    boxElements[i].addEventListener('mouseenter', (e) => {
        e.target.classList.add('mouseover');
    }); 
    boxElements[i].addEventListener('mouseleave', (e) => {
        e.target.classList.remove('mouseover');
    })
}

