// Nicked from http://snipplr.com/view/4882/

function format_mysqldate (mysqldate) {
  // example mysql date: 2008-01-27 20:41:25
  // we need to replace the dashes with slashes
  if(String(mysqldate).charAt(0) == "0") return false;
  var date = String(mysqldate).replace(/\-/g, '/');
  return format_date(date);
}
function format_date (date) {
  // date can be in msec or in a format recognized by Date.parse()
  var d = new Date(date);
  var days_of_week = Array('Sun','Mon','Tue','Wed','Thu','Fri','Sat');
  var day_of_week = days_of_week[d.getDay()];
  var year = d.getFullYear();
  var months = Array('Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec');
  var month = months[d.getMonth()];
  var day = d.getDate();
  var hour = d.getHours();
  var minute = d.getMinutes();
  var am_pm = 'am';
  if(hour == 0) {
    hour = 12;
  } else if (hour == 12) {
    am_pm = 'pm';
  } else if (hour > 12) {
    hour -= 12;
    am_pm = 'pm';
  }
  if(minute < 10) { minute = '0'+minute; }   
  var date_formatted = day_of_week+' '+month+' '+day+' '+year+' '+hour+':'+minute+am_pm;
  return date_formatted;
}