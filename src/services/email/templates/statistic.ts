//import the base email class
import { EmailTemplate } from "./template";

/**
 * Invite email template.
 * @class SendStatisticEmailTemplate
 */
export class SendStatisticEmailTemplate extends EmailTemplate {

  public title: string = "";

  public statistic_info: string = "";
  
  public bbid: any = "";
  
  public date: any = "";
  
  public pie_methode:string = "";

  public pie_os:string = "";

  public line_session:string = "";

  public line_fav_hour:string = "";

  public footer:string = "";
  
  // public bar_fav_day:string = "";
    
  /**
   * Returns the email subject.
   * @method get subject
   * @return {string}
   */
  public get subject(): string {
    return `📊 Statistic für Ihr Beschützerbox ${this.bbid} für ${this.date}`;
  }

  /**
   * Returns the file name in the DIST_PATH directory for this template.
   * @method get fileName
   * @return {string}
   */
  public get fileName(): string {
    return "statistic.html";
  }

  /**
   * Post-content hook.
   * @method post
   */
  public post() {
    //do nothing
  }

  /**
   * Pre-content hook.
   * @method pre
   */
  public pre() {
    //add custom substitutions
    this.email.addSubstitution("-title-", this.title);
    this.email.addSubstitution("-statistic_info-", this.statistic_info);
    this.email.addSubstitution("-bbid-", this.bbid);        
    this.email.addSubstitution("-date-", this.date);
    this.email.addSubstitution("-pie_methode-", this.pie_methode);
    this.email.addSubstitution("-pie_os-", this.pie_os);
    this.email.addSubstitution("-line_session-", this.line_session);
    this.email.addSubstitution("-line_fav_hour-", this.line_fav_hour);
    // this.email.addSubstitution("-bar_fav_day-", this.bar_fav_day);
    this.email.addSubstitution("-footer-", this.footer);    
  }
}