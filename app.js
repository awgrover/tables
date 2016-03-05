console.log("js loading");

// the dbname is the .html's name
var dbname= location.pathname.split(/[\\/]/).pop().replace(/\.[^.]+$/,'');
var db = new PouchDB(dbname);

function catch_pouch_error(err, result) {
  if (!err) {
    console.log('didit');
  } else {
    console.log("fail: "+err,result);
    alert("fail: "+err,result);
    throw(err);
  }
}

function insert_or_update(id, body) {
  console.log("ins/up "+id,body);
  db.get(id, function(error, doc) {
    if (error && error.reason != 'missing') { catch_pouch_error(error, doc) }
    else {
      console.log("extant doc: ",doc);
      var actual = $.extend({}, body);
      actual['_id'] = id;
      if (doc) {
        actual['_rev'] = doc._rev;
        }
      db.put(actual, catch_pouch_error);
    }
  });
}

function record_origin() {
  // Record our "origin"
  insert_or_update(location.toString(),
    {
      type : 'origin', // we'll search for this
      created_at : location.pathname
    }
    );
  }

function show_extant_origins() {
  $('#extantorigins').text('');
  db.query(
    function(doc,emit) {emit(doc.type);}, // the _id is now the .type
    {
      key : 'origin', // the new stream of docs where _id=='origin'
      include_docs : true
    }).then(function(result) {
      console.log("origins",result);
      $(result.rows).each(function(i,doc) {
        $('#extantorigins').append(doc.id + "<br />");
        });
        
    }).catch(catch_pouch_error);
  console.log("finish show extant");
  }

function page2_change(event) {
  console.log("submit..",event);
  var rowid = event.target.id;
  console.log("id",rowid);

  // blank name is "new", add it
  if (rowid == '') {
    db.post(
      {
        type : 'page',
        value : event.target.value
    }).then(function(result) {
      console.log(result);
      event.target.name = result._rev;
      event.target.id = result.id;
    }).catch( catch_pouch_error);
  }

  else {
    db.put({
        _id : rowid,
        _rev : event.target.name,
        type : 'page',
        value : event.target.value
    }).then(function(result) {
      event.target.name = result._rev;
      console.log(result);
    }).catch( catch_pouch_error);
  }
}
function row_change(event) {
  console.log("submit..",event);
  var rowid = event.target.id;
  console.log("id",rowid);

  // blank name is "new" row, add it
  if (rowid == '') {
    db.post(
      {
        type : 'row',
        value : event.target.value
    }).then(function(result) {
      console.log(result);
      event.target.name = result._rev;
      event.target.id = result.id;
      $("#rows_table").append('<tr><td><input value="" name=""></td></tr>');
      $("#rows_form input").change(row_change);
    }).catch( catch_pouch_error);
  }

  else {
    db.put({
        _id : rowid,
        _rev : event.target.name,
        type : 'row',
        value : event.target.value
    }).then(function(result) {
      event.target.name = result._rev;
      console.log(result);
    }).catch( catch_pouch_error);
  }
}

function setup_page2_content() {

  // FIXME: use views
  db.query(
    function(doc,emit) {emit(doc.type);}, // the _id is now the .type
    {
      key : 'page', // the new stream of docs where _id=='row'
      include_docs : true
    }).then(function(result) {
      console.log("page",result.rows);
      var ta = $('#page_editor textarea');

      // FIXME: doing "each" but we only expect 1
      // will do amusing things when you start sync'ing
      $(result.rows).each(function(i,apage) {
        console.log("show "+i,apage);
        ta.text(apage.doc.value);
        ta.id = apage.id;
        ta.name = apage.doc._rev;
        });
    ta.change(page2_change);
        
    }).catch(catch_pouch_error);

  $('#page2link').click(goto_page);

  }

function goto_page() { // always "page2" for now
  console.log("clicked for page2");
  db.query(
    function(doc,emit) {emit(doc.type);}, // the _id is now the .type
    {
      key : 'page', // the new stream of docs where _id=='row'
      include_docs : true
    }).then(function(result) {
      console.log("page",result.rows);

      // FIXME: fetched all but we only expect 1
      // will do amusing things when you start sync'ing
      var html = result.rows[0].doc.value;
      console.log("html",html);
      $('body').html(html);
    }).catch(catch_pouch_error);

  return false;
}

function setup_row_table() {

  // FIXME: use views
  db.query(
    function(doc,emit) {emit(doc.type);}, // the _id is now the .type
    {
      key : 'row', // the new stream of docs where _id=='row'
      include_docs : true
    }).then(function(result) {
      console.log("row",result.rows);
      $(result.rows).each(function(i,arow) {
        console.log("show "+i,arow);
        $('#rows_table').append('<tr><td><input value="'+arow.doc.value+'" name="'+arow.doc._rev+'" id="'+arow.id+'"></td></tr>');
        });
      $("#rows_form input").change(row_change);
        
    }).catch(catch_pouch_error);

  }

$(function() {

  $("#location").text(location.pathname); // .origin doesn't seem to work for file:
  $("#dbname").text(dbname); // .origin doesn't seem to work for file:
  $("#pouchH").text(db); // .origin doesn't seem to work for file:

  $("#clean").click(function() {
    db.destroy(dbname, catch_pouch_error);
    db = new PouchDB(dbname);
    console.log("whacked db");
    });

  record_origin();

  show_extant_origins();

  setup_row_table();

  setup_page2_content();
});
