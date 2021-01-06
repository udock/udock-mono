import { success } from '@udock/plugin-mock'
import { MockData, success as dsmOk } from '../../mock/MockData'

const mockData: MockData = success(dsmOk({
  msg: 'hello by obj'
}))

export default mockData
