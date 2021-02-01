var results, log;
function getUsers(){
  $.ajax({
    type: 'POST',
    async: false,
    url: "admin.php",
    datatype: 'json',
    data: {"survey": true},
    contentType: "application/x-www-form-urlencoded;charset=UTF-8",
    failure: function(){
      alert("Connection failure -- ask David about this (if you really are connected)");
    },
    error: function(a, b, c){
      alert(a.statusText+" "+b+" "+c);
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
        row.appendChild(DOMCell("name", "name-i", results[i]['name']));
        var usercell = DOMCell("username", "username-i", results[i]['username']);
        if(results[i]['approved']==0){
          usercell.appendChild(
            DOMButton("approve", "approve-i", "Approve", approve(i, row)));
        } else {
          usercell.appendChild(
            DOMButton("approve", "approve-i", "New allocation", approve(i, row)));
          usercell.appendChild(
            DOMButton("reset", "reset-i", "Reset password", resetPassword(i, row)));
        }
        row.appendChild(usercell);
        row.appendChild(DOMCell("country", "country-i", results[i]['country']));
        row.appendChild(DOMCell("email", "email-i", results[i]['email']));
        row.appendChild(DOMCell("lastlog", "lastlog-i", results[i]['lastlog']));
        row.appendChild(DOMCell("submissionlog", "submissionlog-i", results[i]['submissionlog']));
        row.appendChild(DOMCell("allocationcount", "allocationcount-i", results[i]['allocations']));
        table.appendChild(row);
      }
    }
  });
  return results;
}

function approve(n, row){
  return function(){
    $.ajax({
      type: 'POST',
      async: true,
      url: "admin.php",
      datatype: 'json',
      data: {"approve": results[n]['username']},
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

function resetPassword(n, row){
  return function(){
    $.ajax({
      type: 'POST',
      async: true,
      url: "admin.php",
      datatype: 'json',
      data: {"reset": results[n]['username']},
      contentType: "application/x-www-form-urlencoded;charset=UTF-8",
      failure: function(){
        log="can't connect";
      },
      success: function(){
        alert("Password has been reset (probably)");
      }
    });
  };
}

$(getUsers);