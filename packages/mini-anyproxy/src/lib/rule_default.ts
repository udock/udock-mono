export default {

  summary: 'the default rule for AnyProxy',

  /**
   *
   *
   * @param {object} requestDetail
   * @param {string} requestDetail.protocol
   * @param {object} requestDetail.requestOptions
   * @param {object} requestDetail.requestData
   * @param {object} requestDetail.response
   * @param {number} requestDetail.response.statusCode
   * @param {object} requestDetail.response.header
   * @param {buffer} requestDetail.response.body
   * @returns
   */
  beforeSendRequest(/* requestDetail */) {
    return null
  },


  /**
   *
   *
   * @param {object} requestDetail
   * @param {object} responseDetail
   */
  beforeSendResponse(requestDetail: object, responseDetail: object) {
    return null
  },


  /**
   * default to return null
   * the user MUST return a boolean when they do implement the interface in rule
   *
   * @param {any} requestDetail
   * @returns
   */
  beforeDealHttpsRequest(/* requestDetail */) {
    return null
  },

  /**
   *
   *
   * @param {any} requestDetail
   * @param {any} error
   * @returns
   */
  onError(requestDetail: object, error: Error) {
    return null
  },


  /**
   *
   *
   * @param {any} requestDetail
   * @param {any} error
   * @returns
   */
  onConnectError(requestDetail: object, erro: Error) {
    return null
  },
}
