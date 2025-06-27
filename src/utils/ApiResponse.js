/**
 * @class ApiResponse
 * @description A standardized response class for successful API requests.
 */
class ApiResponse {
    /**
     * Creates an instance of ApiResponse.
     * @param {number} statusCode - The HTTP status code for the successful response.
     * @param {*} data - The payload to be sent in the response. Can be an object, array, etc.
     * @param {string} [message="Success"] - A descriptive message for the response.
     */
    constructor(statusCode, data, message = "Success") {
      this.statusCode = statusCode;
      this.data = data;
      this.message = message;
      this.success = statusCode < 400; // Success is true for status codes in the 2xx range
    }
  }
  
  export { ApiResponse };
  