const deleteButton = document.getElementById('deleteButton');

deleteButton.addEventListener('click', () => {
    let result = window.confirm('本当に削除しますか？');
    if(result){
        const path = deleteButton.getAttribute('data-path');
        window.location.href = path;
    }else{
        window.alert('企業・タスクデータ削除はキャンセルされました');
    }
});

