import request from '@/utils/request'

// 查询工作模式列表
export function listPattern(query) {
  return request({
    url: '/system/pattern/list',
    method: 'get',
    params: query
  })
}

// 查询工作模式详细
export function getPattern(id) {
  return request({
    url: '/system/pattern/' + id,
    method: 'get'
  })
}

// 新增工作模式
export function addPattern(data) {
  return request({
    url: '/system/pattern',
    method: 'post',
    data: data
  })
}

// 修改工作模式
export function updatePattern(data) {
  return request({
    url: '/system/pattern',
    method: 'put',
    data: data
  })
}

// 删除工作模式
export function delPattern(id) {
  return request({
    url: '/system/pattern/' + id,
    method: 'delete'
  })
}
