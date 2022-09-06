let userid_info=$persistentStore.read("userid_info").split(' ')

dateObj = $script.startTime//获取时间
data=dateObj.getDate()
month=dateObj.getMonth()+1
year=dateObj.getFullYear()
hours=dateObj.getHours()
minutes=dateObj.getMinutes()
let time=year+"-"+month+"-"+data
let times=hours+"点"+minutes+"分"

const headers = {
'User-Agent' : `Mozilla/5.0 (iPhone; CPU iPhone OS 15_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 MicroMessenger/8.0.26(0x18001a31) NetType/WIFI Language/zh_CN`,
'token' : $persistentStore.read("LeoSys_Token"),
'user_ip' : `192.168.199.100`,
};
const body = ``;
//'FULL' 不可用
//'IN_USE' 正在使用
//'FREE' 空闲

(async()=>{
	let time1=18
	let time2=22
	try{
		let layoutseats=await layoutseat()
		let timeseat=await searchseat(time1*60,time2*60)
		let seatinfo=await seat_info()
		let reserveinfo=await reserve_info()
		let checkin=await check_in(reserveinfo)
		token_get(layoutseats)//token获取
		
		let d=''
		let allfull=''
		//console.log(JSON.stringify())

		if(timeseat.status=='fail'){
			console.log('座位信息报错')
			console.log(timeseat.message)
		}
		else{
				for(var i in layoutseats.data.layout){
			
if(layoutseats.data.layout[i].type=='seat'&&layoutseats.data.layout[i].status=='FULL'){	allfull+=layoutseats.data.layout[i].name+' '}
			
	}

			for(var i in timeseat.data.seats){
	d+=timeseat.data.seats[i].name+' ';}
	if(d!=''){
			$notification.post(seatinfo.room+'座位信息 总共:'+seatinfo.totalSeats,'正在使用中:'+seatinfo.inUse+' 剩余:'+seatinfo.free+' 已预约:'+seatinfo.reserved,'时间段内空余<'+d+'>'+`\n`+'不可用 <'+allfull+'>')
	console.log(seatinfo.room+'座位信息 总共:'+seatinfo.totalSeats+'正在使用中:'+seatinfo.inUse+' 剩余:'+seatinfo.free+' 已预约:'+seatinfo.reserved+`\n\n`+'时间段内空余<'+d+'>'+`\n\n`+'不可用 <'+allfull+'>')
			}
		}
	}catch(e){
		console.log('错误信息'+e)
	}finally{
		$done()
	}
	
})()


function layoutseat(){
	return new Promise((resolve,reject)=>{
			$httpClient.get(
    {
      url: `https://leosys.cn/axhu/rest/v2/room/layoutByDate/2/${time}`,
      headers: headers,
      body: body, 
    },
  (error, response, data) => {
//console.log(data)
    jsondata = JSON.parse(data);
		if(error){reject(error)}
		else{resolve(jsondata)}
	})
})
}

//时间段内座位查询
function searchseat(time1,time2){
	const url = `https://leosys.cn/axhu/rest/v2/searchSeats/${time}/${time1}/${time2}?roomId=2&batch=999&page=1`;

return new Promise((resolve,reject)=>{
	$httpClient.get({
		url:url,
		headers:headers
	},(error,response,data)=>{
		if(error){
			reject(error);
		}else{
			resolve(JSON.parse(data));
		}
	})
})
}


//签到函数
function check_in(reservearr){
 let seat_id=reservearr.id
 let seat_loc=reservearr.loc
 let seat_begin=reservearr.begin.split(':')[0]
 let seat_stat=reservearr.stat

if(seat_stat=='RESERVE')
 {console.log('预约座位id：'+seat_id)}

if((seat_begin==(hours+1)||seat_begin==hours)&&seat_stat=='RESERVE'){
	 $httpClient.get(
  {
  url: `https://leosys.cn/axhu/rest/v2/checkIn/${seat_id}`,
  headers: headers
  },(error,response,data)=>{
  jsondata = JSON.parse(data);
  if(jsondata.status=='fail'){$notification.post('签到失败 原因：',jsondata.message,'')}
  else{$notification.post('签到成功 ',jsondata.message,seat_loc)}
  })
 }
}

//预约信息
function reserve_info(){
	return new Promise((resolve,reject)=>{
		 $httpClient.get(
    {
      url: `https://leosys.cn/axhu/rest/v2/history/1/50?page=1`,
      headers: headers,
      body: '', 
    },
  (error, response, data) => {
    jsondata = JSON.parse(data);
		arr=jsondata.data.reservations[0]

		if(error){reject(error)
		}else{resolve(arr)}
	})

 })

}


//座位个数
function seat_info(){
	return new Promise((resolve,reject)=>{
		 $httpClient.get(
    {
      url: `https://leosys.cn/axhu/rest/v2/room/stats2/1/${time}`,
      headers: headers,
      body: '', 
    },
  (error, response, data) => {
    jsondata = JSON.parse(data);
		objarr=jsondata.data[1]
		if(error){reject(error)}
		else{resolve(objarr)}
	})
 })
}


//token获取
function token_get(jsondata){
 if(jsondata.status=="fail"){
    $httpClient.get(
     {
   url: `https://leosys.cn/axhu/rest/auth?username=${userid_info[0]}&password=${userid_info[1]}`,
   headers: {
      'token' : $persistentStore.read("LeoSys_Token"),
     'actCode' : `true`},
   body: '', 
 },(error,response,data)=>{
   tokendata = JSON.parse(data);
 $persistentStore.write(tokendata.data.token,"LeoSys_Token")
   })
  }
}