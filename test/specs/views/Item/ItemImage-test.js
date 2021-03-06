import React from 'react'
import ItemImage from 'src/views/Item/ItemImage'

describe('ItemImage', () => {
  it('renders Image component', () => {
    shallow(<ItemImage />)
      .should.have.descendants('Image')
  })

  it('is wrapped without ui', () => {
    const wrapper = shallow(<ItemImage />)

    wrapper.should.have.prop('wrapped', true)
    wrapper.should.have.prop('ui', false)
  })
})
