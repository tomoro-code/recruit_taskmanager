function beforeSubmit(e){
    const result = window.confirm('変更してもよろしいですか？');
    if(result){
        return true;
    }else{
        return false;
    }
}