

var app = {

   searches: {},

   dbconfig: {
		apiKey: "AIzaSyBBHQ6yBbCm2wvpbEQdDzoGzNUUiZ80fR0",
    	authDomain: "group-project-a8e612.firebaseapp.com",
    	databaseURL: "https://group-project-a8e612.firebaseio.com",
    	storageBucket: "group-project-a8e612.appspot.com",
    	messagingSenderId: "246635514977"
    },



    initFirebase:function() {
		 firebase.initializeApp(this.dbconfig);
		 this.database = firebase.database();
    },


    searchAndAdd:function() {
      var search = this.search();
      this.addSearch(search);
    },

	search:function() {
		var queryURL = 'https://api.data.gov/ed/collegescorecard/v1/schools?api_key=D7r68I5ZV97qXjLtrdTqnxqPTb750zgQrIaRm21s'; 
		var queryFields = '&fields=2014.student.retention_rate.four_year.full_time,2014.cost.attendance.academic_year,school.name,2014.completion.completion_rate_4yr_150nt,school.name,school.city,school.zip,school.state,school.school_url';
		queryURL += queryFields;
		var search = {};
		
		var name = $('#name').val();
		if(name.trim() != "") {
			queryURL += '&school.name=' + name;
			search['name'] = name;
		}
	$('#name').val('');
		
		var city = $('#city').val();

		if(city.trim() != ""){
			queryURL += '&school.city=' + city;
			search['city'] = city;
		}
		$('#city').val('');

		 $.ajax({
          url: queryURL,
          method: "GET"
        })// After data comes back from the request
        .done(function(response) {
        	app.renderSearchResult(response.results);
        })
        return search;
  	},

	renderSearchResult: function(data) {
		var searchMatch = $('#search-match');
		searchMatch.empty();
		
		var table = $('<table>');
		table.addClass('table');
		table.addClass('table-striped');


		searchMatch.append(table);
		var tableHeaders = ['Name', 'Zip', 'City',  'State', 'Url', 'Tutition', 'Students that gradute in 6 years', 'Rentention Rate']
		
		var headerRow = $('<tr>');
		headerRow.attr('scope','row');
		table.append(headerRow);

		for(var i=0;i<tableHeaders.length;i++){
			var headerCell = $('<th>');
			headerCell.text(tableHeaders[i]);
			headerRow.append(headerCell);
		}

		var tableBody= $('<tbody>');
		table.append(tableBody);

		var fields = ['school.name','school.zip', 'school.city','school.state','school.school_url', '2014.cost.attendance.academic_year','2014.completion.completion_rate_4yr_150nt','2014.student.retention_rate.four_year.full_time'];
		for(var i = 0;i<data.length;i++) {
			var school = data[i];
			var row = $('<tr>');
			row.attr('scope','row');
			for(var j=0;j<fields.length;j++){
				var cell = $('<td>');
				cell.text(school[fields[j]]);
				row.append(cell);
			}
			tableBody.append(row);
		}
	},
	addSearch:function(criteria) {
		var searchId = '';
		for(var k in criteria) {
			searchId += k+'=' + criteria[k] + ',';
		}
		criteria.counter = 1;
		criteria.id = searchId;

		//create or udpate counter
		this.database.ref(searchId).transaction(function(record) {
			if(record) {
				record.counter = record.counter + 1;
			} else {
				record = criteria;
			}
			return record;
		});
	},

	sortSearchByCount :function() {
		var result = [];
		for(var k in this.searches) {
			var record = app.searches[k];
			record.id = k;
			result.push(record);
		}
		//actual sorting
		for(var i = 0; i < result.length - 1;i++) {
			for(var j = i + 1; j < result.length; j++) {
				if(result[i].counter < result[j].counter) {
					var temp = result[j];
					result[j] =result[i]
					result[i] = temp; 
				}
			}
		}
		return result;
	},
	renderHistory: function() {

		$('#search-history').empty();
		var list = $('<ul>')
		list.addClass('list-group');
		$('#search-history').append(list);


			var sortedRecords = this.sortSearchByCount();
		
			//show no more then 20 most popular searches
			var maxHistryCount = sortedRecords.length;
			if(maxHistryCount > 10) {
				maxHistryCount = 10;
			}
			var items = '';
			
			for(var i = 0;i< maxHistryCount;i++) {
				var record = sortedRecords[i] 
				var search = '';
				var title = '';

				var template = '<li class="list-group-item d-flex justify-content-between"  data-id="{{searchId}}" data-name="{{name}}" data-city="{{city}}"><span>{{title}}</span><span class="badge badge-default">{{count}}</span></li>';
				var attributes = ''
				for(var key in record) {
					if(key == 'counter' || key == 'id') {
						continue; //skip to next iteration
					}
					if(title.length > 0) {
						title += ',';
					}
					title  += record[key]
				}
				if(!record.name) {
					record.name = '';
				}
				if(!record.city) {
					record.city = '';	
				}
				var data = {
					searchId:record.id,
					attributes:attributes,
					title:title,
					name: record.name,
					city:record.city,
					count:record.counter,
				};
				var expandedTemplate = Mustache.render(template, data);
				items +=  expandedTemplate;

				// item.addClass('list-group-item');
				// item.addClass('d-flex');
				// item.addClass('justify-content-between');
				// list.append(item);
				// item.attr('data-search', search);
				// item.attr('data-id', record.id);
				// var searchText = $('<span>');
								

				// searchText.text(title);
				// item.append(searchText);

				// var counter = $('<span>');
				// counter.addClass('badge');
				// counter.addClass('badge-default');
				
				// counter.text(record.counter);
				// item.append(counter);
				

				
			}
			list.html(items);
			list.children('li').click(function() {
					var name = $(this).attr('data-name');
					$('#name').val(name);

					var city = $(this).attr('data-city');
					$('#city').val(city);

					app.search(true);
					

			})



	},

	setReadListener: function() {
		this.database.ref().on("value", function(data) {
			var recordWithId = data.val();
			for(var k in  recordWithId) {
				app.searches[k] = recordWithId[k];
			}
			app.renderHistory();
		});
	}
				//clear all database
};


$(document).ready(function() {
	
	app.initFirebase();
	app.setReadListener();
	//app.database.ref().remove();


	$('#search').click(function() {
		app.searchAndAdd();
	})
})
