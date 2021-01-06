import { MockConfig } from '@udock/plugin-mock'

const mockData: MockConfig = [
  {
    tunneling: true,
    response: {
      duration: 200,
      status: 404,
      headers: {},
      data: {
        error: 'this mock is not implement ...'
      }
    }
  }
]

export default mockData
