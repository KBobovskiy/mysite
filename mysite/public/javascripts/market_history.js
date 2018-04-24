var firstLoad = true;

function onLoadEvent() {
	if (firstLoad) {
		var ctx = document.getElementById("myChart");
		var myChart = new Chart(ctx, {
			type: 'line',
			data: {
				labels: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
				datasets: [{
					label: '---',
					data: [0, 0, 0, 0, 0, 0, 0, 0, 0],
					backgroundColor: [
						'rgba(100, 200, 100, 0.3)'
					],
					borderColor: [
						'rgba(50,50,50,1)'

					],
					borderWidth: 1
				}]
			}
		});
		firstLoad = false;
	}
}

function onChangeSelectList() {
	let cardName = $("#cardList").val();
	let uriGet = "/getCardHistory?cardName="+cardName;
	uriGet = encodeURI(uriGet);
	//alert(uriGet);	

	$.get(uriGet)
		.done(data => {
			data = JSON.parse(data);
			//alert(data.length);
			var prices = [];
			var labels = [];
			let = lastPrice = "";
			for (let i=0; i<data.length; i++){
				let dateStr = data[i].date;
				dateStr=dateStr.replace("T"," ");
				dateStr=dateStr.substring(0,dateStr.length-5);
				labels.push(dateStr);
				prices.push(data[i].price);
				if(i===0) {lastPrice = data[i].price;}
			}
			$("#last-price").text("Последняя цена: "+lastPrice);
			var ctx = document.getElementById("myChart");
			var myChart = new Chart(ctx, {
				type: 'line',
				data: {
					labels: labels,
					datasets: [{
						label: '# History: '+cardName,
						data: prices,
						backgroundColor: ['rgba(100, 200, 100, 0.3)'],
						borderColor: ['rgba(50,50,50,1)'],
						borderWidth: 1
					}]
				},
				options: {
						legend: {
							onClick: function(event, legendItem) {}
						},
						animation: {
							duration: 0, // general animation time
						},
						hover: {
							animationDuration: 0, // duration of animations when hovering an item
						},
						events: [],
						responsiveAnimationDuration: 0 // animation duration after a resize
					}
			});			
		});
}

//https://www.atlassian.com/git/tutorials/syncing
//https://git-scm.com/book/ru/v1/%D0%9E%D1%81%D0%BD%D0%BE%D0%B2%D1%8B-Git-%D0%A0%D0%B0%D0%B1%D0%BE%D1%82%D0%B0-%D1%81-%D1%83%D0%B4%D0%B0%D0%BB%D1%91%D0%BD%D0%BD%D1%8B%D0%BC%D0%B8-%D1%80%D0%B5%D0%BF%D0%BE%D0%B7%D0%B8%D1%82%D0%BE%D1%80%D0%B8%D1%8F%D0%BC%D0%B8