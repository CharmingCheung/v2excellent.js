var comments = [];
function fillComments(jqDom){
    jqDom.find('div[id^="r_"]').each(function(i,o){
        var cmno = parseInt($(o).find('span.no').text());
        comments[cmno] =
            {
                id: $(o).attr('id'),
                no: cmno,
                user: $(o).find('strong>a').text(),
                content: $(o).find('div.reply_content').text(),
                mentioned: (function(){
                    var mentionedNames = [];
                    $(o).find('div.reply_content>a[href^="/member/"]:not("dark")').each(function(i,o){
                        mentionedNames.push(o.innerHTML);
                    });
                    return mentionedNames;
                }()),
                subComments: []
            };
    });
}

//Get comments from current page
fillComments($('body'));

//Get comment's parent
function findParentComment(comment){
    var parent = undefined;
    for(var i=comment.no-1;i>0;i--){
        var cc = comments[i];
        if($.inArray(cc.user, comment.mentioned) !== -1 && parent === undefined){
            parent = cc;
        }
        //If they have conversation, then make them together.
        if(comment.mentioned.length>0 && cc.user === comment.mentioned[0] && cc.mentioned[0] === comment.user){
            parent = cc;
            break;
        }
    }
    return parent;
}

//Stack comments, make it a tree
function stackComments(){
    for(var i=comments.length-1;i>0;i--){
        var parent = findParentComment(comments[i]);
        if(parent){
            parent.subComments.unshift(comments[i]);
            comments.splice(i,1);
        }
    }
}

//Get other pages comments
var PAGES_COUNT = $('div.inner>a[href^="/t/"].page_normal').length;
var CURRENT_PAGE = 0;
var DOMS = [$(document)];
$('div.inner>a[href^="/t/"].page_normal').each(function(i,o){
    $.get(o.href,function(result){
        var resultDom = $('<output>').append($.parseHTML(result));
        DOMS.push(resultDom);
        fillComments(resultDom);
        CURRENT_PAGE ++;
        //if all comments are sucked.
        if(CURRENT_PAGE === PAGES_COUNT){
            //stack'em
            stackComments();
            //reArrange
            reArrangeComments();
        }
    });
});

function getCommentDom(id){
    var commentDom = undefined;
    $.each(DOMS,function(i,o){
        var result = o.find('div[id="' + id + '"]');
        if(result.length>0){
            commentDom = result;
        }
    });
    return commentDom;
}

function moveComment(comment,parent){
    if(comment){
        var commentDom = getCommentDom(comment.id);
        $.each(comment.subComments,function(i,o){
            moveComment(o,commentDom);
        });
        commentDom.appendTo(parent);
    }
}

function reArrangeComments(){
    $('div.inner:has(a[href^="/t/"].page_normal)').remove();
    $.each(comments,function(i,o){
        moveComment(o,$('#Main>div.box'));
    });
    $('div[id^="r_"]>table>tbody>tr>td:first-child').attr('width','20');
}
$('body').append('<style>.cell{border-bottom:none;}div[id^="r_"] img.avatar{width:20px;border-radius:50%;}div[id^="r_"]>div{margin-left: 21px;}div.box>div[id^="r_"]{border-bottom: 1px solid #E2E2E2;}</style>');
