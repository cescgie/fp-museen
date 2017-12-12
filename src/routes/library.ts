const dotenv = require('dotenv');
dotenv.load();
const crypto = require('crypto');
import fs = require("fs");

export class Library {
    protected string_salt:string;
    protected lang:string;
    protected object_properties:any;
    
    /**
    * Constructor
    *
    * @class Library
    * @constructor
    */
    constructor() {
        this.string_salt = process.env.STRING_SALT;
        this.lang = process.env.LOCALIZATION;
        this.object_properties = ['_id', 'createdAt', 'updatedAt', 'email', 'password', 'token', 'active', 'firstname', 'lastname', 'role', 'boxid'];        
    }

    /**
     * Method to check if "http://" exist in url
     * @param url 
     */
    checkHttp(url) {
      if (!/^(f|ht)tps?:\/\//i.test(url)) {
          url = "http://" + url;
      }
      return url;
    }

    /**
     * Method to generate SHA1
     * @param text 
     * @param salt 
     */
    GetSHA1 (text, salt) {
      let concat = `${text}${salt}`;
      let sha1 = crypto.createHash('sha1');
      sha1.update(concat);
      return sha1.digest('hex');
    }

    /**
     * Method to hash string with specific SALT
     * @param plain 
     */
    hashString (plain) {
      let salt = this.string_salt;
      let mac = this.GetSHA1(plain, salt);
      return mac;
    }

    /**
     * Method to convert array to object
     * @param arr 
     */
    toObject(arr) {
      var rv = {};
      for (var i = 0; i < arr.length; ++i)
        rv[i] = arr[i];
      return rv;
    }

    /**
     * Method to check if value exist in array
     * @param value 
     * @param array 
     */
    isInArray(value, array) {
      return array.indexOf(value) > -1;
    }

    /**
     * Method to check existenz of folder
     * @param path 
     */
    exists(path){
        //Remember file access time will slow your program.
        try{
            fs.accessSync(path);
        } catch (err){
            return false;
        }
        return true;
    }
    
    /**
     * Method for validate date format
     * 
     * @class ApiRoute
     * @param date 
     * @return boolean
     */
    dateValidation(date:any){
        if (date.match(/^(?:(0[1-9]|1[012])[\- \/.](0[1-9]|[12][0-9]|3[01])[\- \/.](19|20)[0-9]{2})$/)){
            return true;
        }else{
            return false;
        }
    }

    /**
     * Get first day & last day of last month with return object value
     */
    getFirstDayLastDayFromLastMonth(){
        var now = new Date();
        var prevMonthLastDate = new Date(now.getFullYear(), now.getMonth(), 0);
        var prevMonthFirstDate = new Date(now.getFullYear() - (now.getMonth() > 0 ? 0 : 1), (now.getMonth() - 1 + 12) % 12, 1);

        var formatDateComponent = (dateComponent)=> {
            return (dateComponent < 10 ? '0' : '') + dateComponent;
        };

        var formatDate = (date)=> {
            return formatDateComponent(date.getMonth() + 1) + '-' + formatDateComponent(date.getDate()) + '-' + date.getFullYear();
        };
        
        let output:any ={
            date1: formatDate(prevMonthFirstDate),
            date2: formatDate(prevMonthLastDate)
        }

        return output;
    }

    /**
     * Use for API date parameter
     * @param rawDate
     */
    formatRawDateToUSADate (rawDate) {
        let date:any = new Date(rawDate);
        var dd = date.getDate();
        var mm = date.getMonth() + 1; //January is 0!
        var yyyy = date.getFullYear();

        if (dd < 10) {
            dd = '0' + dd
        }

        if (mm < 10) {
            mm = '0' + mm
        }

        date = mm + '-' + dd + '-' + yyyy;
        return date;
    }

    /**
     * Local date
     * @param rawDate
     */
    formatRawDateToDEDate (rawDate) {
        let date:any = new Date(rawDate);
        var dd = date.getDate();
        var mm = date.getMonth() + 1; //January is 0!
        var yyyy = date.getFullYear();

        if (dd < 10) {
            dd = '0' + dd
        }

        if (mm < 10) {
            mm = '0' + mm
        }

        date = dd + '.' + mm + '.' + yyyy;
        return date;
    }

    /**
     * Format USA Date to DE Date
     * @param USADate 
     */
    formatUSADateToDEDate (USADate:any){
        let date: any = new Date(USADate);
        return this.formatRawDateToDEDate(date);
    }

    /**
     * Format and push multiple dates into Array
     * @param startDate
     * @param stopDate
     */
    getDates(startDate, stopDate) {
        var dateArray = new Array();
        var day = 1000 * 60 * 60 * 24;
        var diff = (stopDate.getTime() - startDate.getTime()) / day;
        for (var i = 0; i <= diff; i++) {
            var xx = startDate.getTime() + day * i;
            var yy = new Date(xx);
            dateArray.push(yy.getDate() + "." + (yy.getMonth() + 1) + "." + yy.getFullYear());
        }
        return dateArray;
    }

    /**
     * Format and push multiple days into Array
     * @param startDate 
     * @param stopDate
     */
    getDays(startDate, stopDate){
        var dateArray = new Array();
        var day = 1000 * 60 * 60 * 24;
        var diff = (stopDate.getTime() - startDate.getTime()) / day;
        for (var i = 0; i <= diff; i++) {
            var xx = startDate.getTime() + day * i;
            var yy = new Date(xx);
            dateArray.push(yy.getDate());
        }
        return dateArray;
    }

    /**
     * Replace string
     * @param str 
     * @param find 
     * @param replace 
     */
    replaceAll(str, find, replace) {
        return str.replace(new RegExp(find, 'g'), replace);
    }

    /**
     * Get day from date
     * @param date format: dd.mm.yyyy
     * @return number of day
     */
    getDay(date){
        var d = new Date(date);
        var m = d.getDay();
        return m;
    }

    /**
     * Get month from date
     * @param date format: dd.mm.yyyy
     * @return number of month
     */
    getMonth(date){
        var d = new Date(date);
        var m = d.getMonth();
        return m;
    }

    /**
     * Get year from date
     * @param date format: dd.mm.yyyy
     * @return full year in format yyyy
     */
    getYear(date){
        var d = new Date(date);
        var y = d.getFullYear();
        return y;
    }

    /**
     * Get day name
     * @param day 
     */
    getDayName(day:number){
        var days = ["","SUNDAY","MONDAY","TUESDAY","WEDNESDAY","THURSDAY","FRIDAY","SATURDAY"];
        return days[day];
    }
    
    /**
     * Get month name
     * @param month 
     */
    getMonthName(month:number){
        var months = ["","JANUARY","FEBRUARY","MARCH","APRIL","MAY","JUNE","JULY","AUGUST","SEPTEMBER","OCTOBER","NOVEMBER","DECEMBER"];        
        return months[month];
    }
    
    /**
     * Check if string an URL
     * @param str 
     */    
    isURL(str:string) {
        var pattern = new RegExp('^(https?:\\/\\/)?'+ // protocol
        '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.?)+[a-z]{2,}|'+ // domain name
        '((\\d{1,3}\\.){3}\\d{1,3}))'+ // OR ip (v4) address
        '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*'+ // port and path
        '(\\?[;&a-z\\d%_.~+=-]*)?'+ // query string
        '(\\#[-a-z\\d_]*)?$','i'); // fragment locator
        return pattern.test(str);
    }
    
    /**
     * Check if obj an array and return boolean
     * @param obj 
     */
    isArray(obj){
        return !!obj && obj.constructor === Array;
    }
    
    /**
     * Get keys of an object
     * @param obj 
     */
    getKeys(obj){
        var keys = [];
        for(var key in obj){
           keys.push(key);
        }
        return keys;
    }

    /**
     * Delete item from array
     * @param item 
     * @param array 
     */
    deleteItemFromArray(item,array){
        var index = array.indexOf(item);
        array.splice(index, 1);
        return array;
    }

    /**
     * Return user data according permissions
     * @param data in Object
     * @param permissions in Array
     * @param status in String ("only" or "except"), default: 'only'
     */
    dataWithPermissions(data:any,permissions:any,status:string){
        if(status=='' || status == 'undefined' || status == null || permissions == null){
            status = 'all';
        }
        let user_data_according_permissions:any={};
        switch (status) {
            case "only":
                for(let j = 0; j < permissions.length; j++){
                    if(permissions[j] in data){
                        user_data_according_permissions[permissions[j]]= data[permissions[j]];
                    }
                }
                break;
            case "except":
                let all_object_properties: any = this.object_properties;

                for(let i = 0; i < permissions.length; i++){
                    if (all_object_properties.indexOf(permissions[i]) !== -1) {
                        all_object_properties.splice(all_object_properties.indexOf(permissions[i]), 1);
                    }
                }
                
                for(let j = 0; j < all_object_properties.length; j++){
                    user_data_according_permissions[all_object_properties[j]]= data[all_object_properties[j]];                    
                }
                break;
            case "all":
                user_data_according_permissions = data;
                break;
        }
        return user_data_according_permissions;
    }

    /**
     * Matching 2 arrays
     * @param a 
     * @param b 
     */
    getMatchedArray(a, b) {
        var matches = [];
    
        for ( var i = 0; i < a.length; i++ ) {
            for ( var e = 0; e < b.length; e++ ) {
                if ( a[i] == b[e] ) matches.push( a[i] );
            }
        }
        return matches;
    }
}
