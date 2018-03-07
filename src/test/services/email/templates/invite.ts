import { suite, test } from "mocha-typescript";
import "mocha";

//use q promises
global.Promise = require("q").Promise;

//require chai and use should assertions
let chai = require("chai");
chai.should();

//import email
import { Email } from "../../../../services/email/facades/email";
import { SendInviteEmailTemplate } from "../../../../services/email/templates/invite";

//import file system i/o api
import * as fs from "fs";

const dotenv = require('dotenv');
dotenv.load();

@suite
class SendInviteEmailTemplateTest {

  //email
  private template: SendInviteEmailTemplate;

  // IMPORTANT TEST CONTENT
  public before() {
    this.template = new SendInviteEmailTemplate();
    this.template.firstName = "Chocho The Cat";
    this.template.groupName = "Berlin - Samstag";
    this.template.inviter = "Chocho";
    this.template.body = "<strong>Message Body Strong</strong>";
  }

  @test("should create")
  public create() {
    this.template.should.be.an.instanceof(SendInviteEmailTemplate);
  }

  @test("should load the content")
  public content() {
    //build template file path
    var path: string = `${SendInviteEmailTemplate.DIST_PATH}/${this.template.fileName}`;

    //verify template file exists
    if (!fs.existsSync(path)) {
      throw new Error(`[SendInviteEmailTemplateTest.content] The file does not exist {path: ${path}}.`);
    }

    //read file
    let value = fs.readFileSync(path).toString();
    
    //get content
    let content = this.template.content;
    
    //test content
    content.should.be.an("object");
    content.should.have.property("type").that.eqls(this.template.type);
    content.should.have.property("value").that.eqls(value);
  }

  @test("should send an email")
  public send() {
    // IMPORTANT
    const EMAIL: string = process.env.TO_EMAIL;
    const NAME: string = process.env.TO_NAME;

    //set to
    this.template.email.addTo(EMAIL, NAME);

    //send
    return this.template.send().catch(error => {
      console.warn(error);
      console.warn(error.response.body.errors);
    });
  }

}