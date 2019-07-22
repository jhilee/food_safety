const search_btn = document.getElementById("search");
const api_adverse_event = 'https://api.fda.gov/food/event.json';
const api_recall_event = 'https://api.fda.gov/food/enforcement.json';
const result_limit = 99;
eventType = '';
var FINAL;

function create_api_query(name){
  var base_query = ''
  if (eventType.includes('product')){
    base_query = api_adverse_event;
    base_query += `?search=products.name_brand:"${name}"&limit=${result_limit}` ;
  }
  else {
    base_query = api_recall_event;
    base_query += `?search=recalling_firm:"${name}"&limit=${result_limit}` ;
  }

  console.log(base_query);
  return base_query
}

function categorize_recall(name,data,data_type,adv_event){
  if (!(name in adv_event)){
    var adverse_event = {};
    var temp = {};
    var temp_data = data[data_type];
    temp[temp_data] = 1;
    adverse_event[data_type] = temp;
    adv_event[name] = adverse_event;


  } else {
    if (!(data_type in adv_event[name])){
      adv_event[name][data_type] = {};
    }
    temp_data = data[data_type]
    if (temp_data in adv_event[name][data_type]){
      adv_event[name][data_type][temp_data] += 1;
  } else {
    adv_event[name][data_type][temp_data] = 1;
}
}
}

function categorize_result(name,data,data_type,adv_event){
  if (!(name in adv_event)){
    var adverse_event = {};
    var temp = {};

    if (data[data_type].length == 0){
      adverse_event[data_type] = 0;
    } else {
      for (j in data[data_type]){
      var temp_data = data[data_type][j];
      temp[temp_data] = 1;
    }
      adverse_event[data_type] = temp;
  }

    adv_event[name] = adverse_event;


  } else {

    if (data[data_type].length == 0){
      adv_event[name][data_type] = {};
    } else{
    for (j in data[data_type]){
      if (!(data_type in adv_event[name])){
        adv_event[name][data_type] = {};
      }
      temp_data = data[data_type][j];
      if (temp_data in adv_event[name][data_type]){
        adv_event[name][data_type][temp_data] += 1;
    } else {
      adv_event[name][data_type][temp_data] = 1;
    }
    }
  }
}

}

function process_recall(data){
  console.log("in recall");
  var adverse_events = {};

  for (i in data.results){
    result = data.results[i];

    console.log(result);
    var adverse_event = {};
    firm_name = result["recalling_firm"];
    categorize_recall(firm_name,result,"reason_for_recall",adverse_events);
    categorize_recall(firm_name,result,"product_type",adverse_events);
    categorize_recall(firm_name,result,"country",adverse_events);
    categorize_recall(firm_name,result,"product_description",adverse_events);


  }
  return adverse_events;
}

function process_adv(data){
  console.log("in processing");
  var adverse_events = {};
  for (i in data.results){
    result = data.results[i];
    console.log(result);
    product_name = result.products[0]["name_brand"];

    categorize_result(product_name,result,"reactions",adverse_events);
    categorize_result(product_name,result,"outcomes",adverse_events);
    adverse_events[product_name]["product_type"] = result.products[0]["industry_name"];
    adverse_events[product_name]["date"] = result.date_created;
  }
  //console.log(adverse_events);
  return adverse_events;
}

function process_adv2(data){
  console.log("in adv2");
  var adverse_events = {};
  adverse_events["reactions"] = {};
  adverse_events["product_name"] = {}
  for (i in data.results){
    result = data.results[i];
    product_name = result.products[0]["name_brand"];
    for (reaction in result["reactions"]){
      reaction = result["reactions"][reaction]
      if (!(reaction in adverse_events["reactions"])){
        adverse_events["reactions"][reaction] = 1;
      }else adverse_events["reactions"][reaction] += 1;
    }
    if (!(product_name in adverse_events["product_name"])){
      adverse_events["product_name"][product_name] = 1;
    }else adverse_events["product_name"][product_name] += 1;
  }
  //console.log(adverse_events);
  return adverse_events;
}

function sum_data(data,data_type){
  var final_data = {};
  for (i in data){
    if (data[i][data_type] in final_data){
      final_data
    }

  }
}

function draw_recall_table(){
  var data = new google.visualization.DataTable();
  var data_array =[];

  data.addColumn('string', 'Company Name');
  data.addColumn('string', 'Reason for Recall');
  for (i in FINAL){
    for (j in FINAL[i]["reason_for_recall"]){
      console.log(j);
      data_array.push([i,j]);
    }
  }
  data.addRows(data_array);

  var table = new google.visualization.Table(document.getElementById('table_div'));

  table.draw(data, {showRowNumber: true, width: '100%', height: '100%'});
}

function draw_adv_Chart() {
  var data_array = [["x","y"]];

  for (i in FINAL["reactions"]){
      data_array.push([i,FINAL["reactions"][i]]);
  }
    var data = google.visualization.arrayToDataTable(data_array);

    var options = {
      title: 'Reactions',
      pieHole: 0.4,
    };

    var chart = new google.visualization.PieChart(document.getElementById('donutchart'));
    chart.draw(data, options);
  }

  function draw_adv_Table() {

        var data = new google.visualization.DataTable();
        var data_array =[];

        data.addColumn('string', 'Product Name');
        for (i in FINAL["product_name"]){
          data_array.push([i]);
        }
        data.addRows(data_array);

        var table = new google.visualization.Table(document.getElementById('table_div'));

        table.draw(data, {showRowNumber: true, width: '100%', height: '100%'});
      }

function send_request(name){
  // Making API calls
  // Create a requet variable and assign a new XMLHttpRequest object to it.
  var request = new XMLHttpRequest();
  var final_data = {};

  // Open a new connction, using the GET request on the URL endpoint
  request.open('GET', create_api_query(name), true);

  request.onload = function() {
    // Being accessing JSON data
    var data = JSON.parse(this.response)

    // if no result found
    var message;
    message = document.getElementById("noresult");
    message.innerHTML = "";
    try{
    if (request.status == 404){
        throw "No result found.";
        //console.log(request.status);
      }
        else {
        //  console.log("going to process");
          //console.log(data);
          if (eventType === "product_name"){
            FINAL = process_adv2(data);
            google.charts.load("current", {packages:["corechart"]});
            google.charts.setOnLoadCallback(draw_adv_Chart);
            google.charts.load('current', {'packages':['table']});
            google.charts.setOnLoadCallback(draw_adv_Table);
          }
            else {
            FINAL = process_recall(data);
            google.charts.load('current', {'packages':['table']});
            google.charts.setOnLoadCallback(draw_recall_table);
          }
          }

    }

  catch(err){
    message.innerHTML = err;
  }

  console.log("final_data : ");
  console.log(FINAL);
}

  // Send request
  request.send()
  console.log("sent");
}

//when you click SEARCH button
function search_click(){
    var query_name = document.getElementById(eventType + "_input");
    console.log("in btn :" + eventType);
    if (query_name.value){
      console.log(query_name.value);
      console.log("send_request");
      send_request(query_name.value.toUpperCase());
    }
    else alert("type the name");

}




function openTab(evt, eventName) {
  var i, tabcontent, tablinks;
  tabcontent = document.getElementsByClassName("tabcontent");
  for (i = 0; i < tabcontent.length; i++) {
    tabcontent[i].style.display = "none";
  }
  tablinks = document.getElementsByClassName("tablinks");
  for (i = 0; i < tablinks.length; i++) {
    tablinks[i].className = tablinks[i].className.replace(" active", "");
  }
  document.getElementById(eventName).style.display = "block";
  evt.currentTarget.className += " active";
  eventType = eventName;
}
