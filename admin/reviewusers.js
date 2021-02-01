var results, log;
function getApplicants(){
  $.ajax({
    type: 'POST',
    async: false,
    url: "admin.php",
    datatype: 'json',
    data: {"review": true},
    contentType: "application/x-www-form-urlencoded;charset=UTF-8",
    failure: function(){
      log="can't connect";
    },
    success: function(data){
      results=JSON.parse(data);
      if(results==0){
        alert("No new applications to approve");
        return;
      }
      var table = DOMTable("apps", "apps");
      document.body.appendChild(table);
      var row;
      for(var i=0; i<results.length; i++){
        row=DOMRow("app-row", "app-i");
        row.appendChild(DOMTextInput("name", "name-i", results[i]['name']));
        row.appendChild(DOMTextInput("username", "username-i", results[i]['username']));
        row.appendChild(DOMTextInput("country", "country-i", results[i]['country']));
        row.appendChild(DOMTextInput("email", "email-i", results[i]['email']));
        row.appendChild(DOMButton("approve", "approve-i", "Approve", approve(i, row)));
        table.appendChild(row);
      }
    }
  });
  return results;
}

function approve(n, row, email){
  return function(){
    $.ajax({
      type: 'POST',
      async: true,
      url: "admin.php",
      datatype: 'json',
      data: {"approve": results[n]['username'], "email": results[n]['email']},
      contentType: "application/x-www-form-urlencoded;charset=UTF-8",
      failure: function(){
        log="can't connect";
      },
      success: function(){
        $(row).hide();
      }
    });
  };
}