//import the base email class
import { EmailTemplate } from "./template";

/**
 * Invite email template.
 * @class SendStatisticEmailTemplate
 */
export class SendConfirmationEmailTemplate extends EmailTemplate {

  public title: string = "";

  public confirmURL: string = "";

  public lastname: string = "";

  public user_email: string = "";
  
  // public bar_fav_day:string = "";
    
  /**
   * Returns the email subject.
   * @method get subject
   * @return {string}
   */
  public get subject(): string {
    return `Confirmation Email`;
  }

  /**
   * Returns the file name in the DIST_PATH directory for this template.
   * @method get fileName
   * @return {string}
   */
  public get fileName(): string {
    return "confirmation.html";
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
    this.email.addSubstitution("-confirmURL-", this.confirmURL);
    this.email.addSubstitution("-lastname-", this.lastname);
    this.email.addSubstitution("-user_email-", this.user_email);
  }
}