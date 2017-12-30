import {} from "node";
import { IConfiguration } from "./config";
const dotenv = require('dotenv');
dotenv.load();

export class BaseConfiguration implements IConfiguration {

  //sendgrid
  public sendGrid: {
    key: string
  };

  /**
   * Constructor
   *
   * @class BaseConfiguration
   * @constructor
   */
  constructor() {
    // IMPORTANT!!!
    this.sendGrid = {
      key: process.env.SENDGRID_API_KEY
    };
  }

  /**
   * Returns true if this configuraiton is for production use.
   *
   * @class BaseConfiguration
   * @method isProduction()
   * @return boolean
   */
  public isProduction(): boolean {
    return true;
  }

  /**
   * Returns true if this configuraiton is for test use.
   *
   * @class BaseConfiguration
   * @method isTest()
   * @return boolean
   */
  public isTest(): boolean {
    return false;
  }

  /**
   * Returns the string representation of this object.
   *
   * @class BaseConfiguration
   * @method toString()
   * @return string
   */
  toString(): string {
    return "production";
  }
};