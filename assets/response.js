export default class successResponse{
constructor (result={}, responseMessage= 'Opration successfull ',responseCode=200){
    this.result = result || {};
    this.responseMessage = responseMessage;
    this.responseCode = responseCode;
}
}




