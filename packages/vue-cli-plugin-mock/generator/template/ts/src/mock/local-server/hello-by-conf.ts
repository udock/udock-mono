import { MockConfig } from '@udock/plugin-mock'

const mockData: MockConfig = [
  {
    tunneling: true,
    response: {
      duration: 200,
      status: 404,
      headers: {},
      data: {
        msg: 'hello-by-conf',
        'id|0-999': 0
      }
    }
  }
]

export default mockData
