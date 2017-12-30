//import the base email class
import { EmailTemplate } from "./template";

/**
 * Invite email template.
 * @class SendForgotPasswordTemplate
 */
export class SendForgotPasswordTemplate extends EmailTemplate {

  public title: string = "";

  public email_user: string = "";
    
  public forgotPasswordURL: string = "";

  /**
   * Returns the email subject.
   * @method get subject
   * @return {string}
   */
  public get subject(): string {
    return `Forgot Password Email`;
  }

  /**
   * Returns the file name in the DIST_PATH directory for this template.
   * @method get fileName
   * @return {string}
   */
  public get fileName(): string {
    return "password.html";
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
    this.email.addSubstitution("-email_user-", this.email_user);     
    this.email.addSubstitution("-forgotPasswordURL-", this.forgotPasswordURL); 
  }
}