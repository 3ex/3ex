
var reserved = 1;


var protocol = new Object();
protocol.svid = {
    SVID_ALL : 0,
	SVID_MARKET : 100,
 };

protocol.uri = {
    PMarketPing_uri				: protocol.svid.SVID_MARKET << 16 | 1,
    PMarketSubInfo_uri		: protocol.svid.SVID_MARKET << 16 | 2,
    PMatchSuccessInfo_uri		: protocol.svid.SVID_MARKET << 16 | 3,
    PMarketOrder_uri			: protocol.svid.SVID_MARKET << 16 | 4,
    PMarket24HoursData_uri		: protocol.svid.SVID_MARKET << 16 | 5,
    PMarketKLine_uri			: protocol.svid.SVID_MARKET << 16 | 6,
	PMarketKLineRes_uri			: protocol.svid.SVID_MARKET << 16 | 7,
	PMarketKLineCurrent_uri		: protocol.svid.SVID_MARKET << 16 | 8,
	PMarketOptional_uri			: protocol.svid.SVID_MARKET << 16 | 9,
	PMarketWatch24HoursData_uri : protocol.svid.SVID_MARKET << 16 | 10,
	PMarketWatchCoinCap_uri		: protocol.svid.SVID_MARKET << 16 | 11,

};

protocol.pack = function(uri, items, isRetArray, isPushHeader) {
    var size = 0;
    var blobItemArray = [];

    if (isPushHeader == undefined) {
        isPushHeader = true;
    }

    for (var idx in items) {
        switch (items[idx].type) {
        case 'uint8':
            //console.info("uint8");
            var buffer = new ArrayBuffer(1);
            new DataView(buffer).setUint8(0, items[idx].value, false);
            blobItemArray.push(buffer);
            size += 1;
            break;
        case 'uint16':
            //console.info("uint16");
            var buffer = new ArrayBuffer(2);
            new DataView(buffer).setUint16(0, items[idx].value, false);
            blobItemArray.push(buffer);
            size += 2;
            break;
        case 'uint32':
            //console.info("uint32");
            var buffer = new ArrayBuffer(4);
            new DataView(buffer).setUint32(0, items[idx].value, false);
            blobItemArray.push(buffer);
            size += 4;
            break;
        case 'uint64':
            //console.info("uint64");
            var buffer = new ArrayBuffer(8);
            new DataView(buffer).setUint32(0, items[idx].value.hi, false);
            new DataView(buffer).setUint32(4, items[idx].value.lo, false);
            blobItemArray.push(buffer);
            size += 8;
            break;
        case 'string16':
            //console.info("string");
            var buffer = new ArrayBuffer(2);
            var reallen = items[idx].value.replace(/[\u0391-\uFFE5]/g,"aaa").length;
            new DataView(buffer).setUint16(0, reallen, false);
            blobItemArray.push(buffer);
            blobItemArray.push(items[idx].value);
            size += 2 + items[idx].value.length;
            break;
        case 'string32':
            //console.info("string");
            var buffer = new ArrayBuffer(4);
            new DataView(buffer).setUint32(0, items[idx].value.length, false);
            blobItemArray.push(buffer);
            blobItemArray.push(items[idx].value);
            size += 4 + items[idx].value.length;
            break;
        case 'vector16':
            //console.info("vector16");
            var buffer = new ArrayBuffer(2);
            new DataView(buffer).setUint16(0, items[idx].value.length, false);
            blobItemArray.push(buffer);
            for (var vIdx in items[idx].value) {
                var vRet = protocol.pack(null, items[idx].value[vIdx], true, false);
                blobItemArray = blobItemArray.concat(vRet.blobItemArray);
                size += vRet.size;
            }
            break;
        case 'vector32':
            //console.info("vector32");
            var buffer = new ArrayBuffer(4);
            new DataView(buffer).setUint32(0, items[idx].value.length, false);
            blobItemArray.push(buffer);
            for (var vIdx in items[idx].value) {
                var vRet = protocol.pack(null, items[idx].value[vIdx], true, false);
                blobItemArray = blobItemArray.concat(vRet.blobItemArray);
                size += vRet.size;
            }
            break;
        case 'blob':
            //console.info("blob");
            var buffer = new ArrayBuffer(2);
            new DataView(buffer).setUint16(0, items[idx].value.size, false);
            blobItemArray.push(buffer);
            blobItemArray.push(items[idx].value);
            size += 2 + items[idx].value.size;
            break;
        default:
            console.error("Unkown blobItem type [" + items[idx].type + "].");
            return undefined;
        };
    };

    if (isPushHeader) {
        //Header
        var buffer = new ArrayBuffer(10);
        size += 10;
        new DataView(buffer).setUint32(0, size, false);
        new DataView(buffer).setUint32(4, uri, false);
        new DataView(buffer).setUint16(8, reserved, false);

        blobItemArray.splice(0, 0, buffer);
    }

    console.info("size:" + (size));
    if (isRetArray == true) {
        return {
            blobItemArray : blobItemArray,
            size : size
        };
    }

    var blob = new Blob(blobItemArray);

    return blob;
};


function threeExSDK(option) {

    var host = option.host;

    this.getHost = function() {
        return host;
    };
	this.setHost = function(h) {
        host = h;
    };
    var socket = null;

    function initSocket(imv) {
        socket = new WebSocket(host);
        socket.onopen = imv.onopen;
        socket.onmessage = imv.onmessage;
        socket.onclose = imv.onclose;
        socket.error = imv.error;
        socket.binaryType = "blob";
    };
	
	function numberToIp(num) {   
	   var str;
	  var tt = new Array();
	  tt[0] = (num >>> 24) >>> 0;
	  tt[1] = ((num << 8) >>> 24) >>> 0;
	  tt[2] = (num << 16) >>> 24;
	  tt[3] = (num << 24) >>> 24;
	  str = String(tt[3]) + "." + String(tt[2]) + "." + String(tt[1]) + "." + String(tt[0]);
	  return str;
	}
	this.closeWebSocket = function() {
		socket.close();
		
		delete( socket);
		socket = null;
	}
	
    this.connect = function() {
        if (!socket || socket.readyState != 1) {
            initSocket(this);
            socket.myobj = this;
        }
    };

    this.onopen = function(obj) {
		
        console.info("websoket connect. " + host);
		 setInterval(function() {
             obj.currentTarget.myobj.ping();
         }, 60000);
		 
		 

    };

    this.onmessage = function(evt) {
        var fr = new FileReader();
        fr.readAsArrayBuffer(evt.data);
        
        fr.onload = function() {
            var dv = new DataView(this.result);
			var msgID= dv.getUint32(4);
			//console.info("size:" +dv.byteLength );
			
			if(msgID == protocol.uri.PMarketOrder_uri) //挂单数据
			{
                var jsonString = decodeBufferString(dv,dv.getUint16(10),12);
                fn.MarketOrder(jsonString);
			}
			if(msgID == protocol.uri.PMarket24HoursData_uri)
			{
				var jsonString = decodeBufferString(dv,dv.getUint16(10),12);
				fn.Market24HoursData(jsonString);
			}
			if(msgID == protocol.uri.PMatchSuccessInfo_uri) //成交数据
			{
                var jsonString = decodeBufferString(dv,dv.getUint16(10),12);
				fn.MatchSuccessInfo(jsonString);
            }
			if(msgID == protocol.uri.PMarketKLineRes_uri) //k线数据
			{
               
				var offset  = 10;
				var len = dv.getUint16(offset);
				offset+=2;
                var market = decodeBufferString(dv,len,offset);
				offset +=len;
				len = dv.getUint16(offset)
				offset+=2;
				var coin = decodeBufferString(dv,len,offset);
				offset+=len;
				var type = dv.getUint16(offset);
				offset+=2;
				var offset_k = dv.getUint16(offset);
				offset+=2;
				var time = dv.getUint32(offset);
				offset+=4;
				len = dv.getUint16(offset);
				offset+=2;
				var data = decodeBufferString(dv,len,offset);
				
				
				 var json = [];
				 var info = {};
				 info.market = market;
				 info.coin = coin;
				 info.type = type;
				 info.offset_k = offset_k;
				 info.time = time;
				 
				 json.push(info);
				 json.push(data);
				 var jsonStr = JSON.stringify(json);
				 fn.MarketKLine( jsonStr);
            }
			if(msgID == protocol.uri.PMarketKLineCurrent_uri) //当前分钟k线数据
			{
				var offset  = 10;
				var len = dv.getUint16(offset);
				offset+=2;
                var jsonString = decodeBufferString(dv,len,offset);
				offset +=len;
				len = dv.getUint16(offset)
				offset+=2;
				var jsonStringKline = decodeBufferString(dv,len,offset);
				
				var json = [];
				json.push(jsonString);
				json.push(jsonStringKline);
				var jsonStr = JSON.stringify(json);
				fn.MarketKLineCurrent( jsonStr);
            }
			
			if(msgID == protocol.uri.PMarketWatch24HoursData_uri)
			{
				var jsonString = decodeBufferString(dv,dv.getUint16(10),12);
				fn.MarketWatch24HoursData(jsonString);
			}
			
			if(msgID == protocol.uri.PMarketWatchCoinCap_uri)
			{
				var jsonString = decodeBufferString(dv,dv.getUint16(10),12);
				fn.PMarketWatchCoinCap(jsonString);
			}
			
        };
        
    };

    this.onclose = function() {
        console.info("WebSocketClosed");

      //  window.location.reload();
        //this.connect();
        //obj.currentTarget.myobj.connect();
    };

    this.onerror = function() {
        console.log("WebSocketError");
    };

    this.send = function (message, callback) {
        this.waitForConnection(function () {
            socket.send(message);
            if (typeof callback !== 'undefined') {
                callback();
            }
        }, 1000);
    };

    this.waitForConnection = function (callback, interval) {
        if (socket.readyState === 1) {
            callback();
        } else {
            var that = this;
            // optional: implement backoff for interval here
            setTimeout(function () {
                that.waitForConnection(callback, interval);
            }, interval);
        }
    };

    this.ping = function(){
        //console.log('ping...');
		var packInfo = protocol.pack(protocol.uri.PMarketPing_uri,[{
			type:'uint32',
			value: Date.parse(new Date())/1000
		}]);
		this.send(packInfo);
	}

    this.subInfo = function(market,coin){
        var realcoin = typeof coin == 'undefined' ? '' : coin;
        var packInfo = protocol.pack(protocol.uri.PMarketSubInfo_uri,[{
            type:'string16',
            value: market
        },{
            type:'string16',
            value: realcoin
        }]);
        this.send(packInfo);
    }

	this.klineInfo = function(market,coin, type, offset, time){
		console.info("****get k line info");
        var realcoin = typeof coin == 'undefined' ? '' : coin;
        var packInfo = protocol.pack(protocol.uri.PMarketKLine_uri,[{
            type:'string16',
            value: market
        },{
            type:'string16',
            value: realcoin
        },{
            type:'uint16',
            value: type
        },{
            type:'uint16',
            value: offset
        },{
            type:'uint32',
            value: time
        }
		]);
        this.send(packInfo);
    }
	this.subMarketInfo = function(info){
		
		var marketInfo = {};
		marketInfo.market = info;
		var jsonStr = JSON.stringify(marketInfo);
        var packInfo = protocol.pack(protocol.uri.PMarketOptional_uri,[{
            type:'string16',
            value: jsonStr
        }]);
	    this.send(packInfo);
    }
	
	this.marketinfLogin = function (device_type, token)
	{
	 var packInfo = protocol.pack(protocol.uri.PMarketLogin_uri,[
		{
            type:'uint16',
            value: device_type
        },
		{
			 type:'string16',
            value: token
		}
		]);
        this.send(packInfo);	
	}
	
	this.sendMsg = function (formid, toid, msg)
	{
	 var packInfo = protocol.pack(protocol.uri.PMarketSendMsg_uri,[
		{
            type:'uint32',
            value: formid
        },
		{
            type:'uint32',
            value: toid
        },
		{
			 type:'string16',
            value: msg
		}
		]);
        this.send(packInfo);	
	}
	

  
};

function decodeUTF8(arr) {
    var str = '';
    for (var i = 0; i < arr.length; i++) {
        str += String.fromCharCode(arr[i]);
    }
    return decodeURIComponent(escape(str));
}

function decodeBufferString(buffer,lenth,offer_set){
	var ret_arr = [];
    for(var i =0;i<lenth;++i){
    	ret_arr.push(buffer.getUint8(offer_set+i));
    }
    var ret_arr_uint8 = new Uint8Array(ret_arr);
    return decodeUTF8(ret_arr_uint8);
}
