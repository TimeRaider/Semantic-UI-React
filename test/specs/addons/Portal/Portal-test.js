import _ from 'lodash'
import React from 'react'
import { unmountComponentAtNode } from 'react-dom'

import { domEvent, sandbox } from 'test/utils'
import Portal from 'src/addons/Portal/Portal'

let attachTo
let wrapper

const wrapperMount = (node, opts) => {
  wrapper = mount(node, opts)
  return wrapper
}

const nativeEvent = { nativeEvent: { stopImmediatePropagation: _.noop } }

describe('Portal', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
    attachTo = undefined
    wrapper = undefined
  })

  afterEach(() => {
    if (wrapper && wrapper.unmount) wrapper.unmount()
    if (attachTo) document.body.removeChild(attachTo)
  })

  it('propTypes.children should be required', () => {
    Portal.propTypes.children.should.equal(React.PropTypes.node.isRequired)
  })

  it('Portal.node should be undefined if portal is not open', () => {
    wrapperMount(<Portal><p>Hi</p></Portal>)
    const instance = wrapper.instance()

    expect(instance.node).to.equal(undefined)
  })

  it('should append portal with children to the document.body', () => {
    wrapperMount(<Portal open><p>Hi</p></Portal>)
    const instance = wrapper.instance()

    instance.node.firstElementChild.tagName.should.equal('P')
    document.body.lastElementChild.should.equal(instance.node)
    document.body.childElementCount.should.equal(1)
  })

  it('when props.open is false and then set to true should open portal', () => {
    wrapperMount(<Portal open={false}><p>Hi</p></Portal>)
    const instance = wrapper.instance()

    document.body.childElementCount.should.equal(0)

    // Enzyme docs say it merges previous props but without children, react complains
    wrapper.setProps({ open: true, children: <p>Hi</p> })
    document.body.lastElementChild.should.equal(instance.node)
    document.body.childElementCount.should.equal(1)
  })

  it('when props.open is true and then set to false should close portal', () => {
    wrapperMount(<Portal open><p>Hi</p></Portal>)
    const instance = wrapper.instance()

    document.body.lastElementChild.should.equal(instance.node)
    document.body.childElementCount.should.equal(1)

    wrapper.setProps({ open: false, children: <p>Hi</p> })
    document.body.childElementCount.should.equal(0)
  })

  it('should add className to the portal\'s wrapping node', () => {
    wrapperMount(<Portal className='some-class' open><p>Hi</p></Portal>)

    document.body.lastElementChild.className.should.equal('some-class')
  })

  it('should update className on the portal\'s wrapping node when props.className changes', () => {
    wrapperMount(<Portal className='some-class' open><p>Hi</p></Portal>)

    wrapper.setProps({ className: 'some-other-class', children: <p>Hi</p> })
    document.body.lastElementChild.className.should.equal('some-other-class')
  })

  describe('prepend', () => {
    beforeEach(() => {
      document.body.innerHTML = '<div></div>'
    })

    it('appends portal by default', () => {
      wrapperMount(<Portal open><p>Hi</p></Portal>)
      const instance = wrapper.instance()

      document.body.childElementCount.should.equal(2)
      document.body.lastElementChild.should.equal(instance.node)
    })

    it('prepends portal by when passed', () => {
      wrapperMount(<Portal open prepend><p>Hi</p></Portal>)
      const instance = wrapper.instance()

      document.body.childElementCount.should.equal(2)
      document.body.firstElementChild.should.equal(instance.node)
    })
  })

  describe('callbacks', () => {
    it('should call props.onMount() when portal opens', () => {
      const props = { open: false, onMount: sandbox.spy() }
      wrapperMount(<Portal {...props}><p>Hi</p></Portal>)

      wrapper.setProps({ open: true, children: <p>Hi</p> })
      props.onMount.should.have.been.calledOnce()
    })

    it('should not call props.onMount() when portal receives props', () => {
      const props = { open: false, onMount: sandbox.spy() }
      wrapperMount(<Portal {...props}><p>Hi</p></Portal>)

      wrapper.setProps({ open: true, children: <p>Hi</p>, className: 'old' })
      props.onMount.should.have.been.calledOnce()

      wrapper.setProps({ open: true, children: <p>Hi</p>, className: 'new' })
      props.onMount.should.have.been.calledOnce()
    })

    it('should call props.onUnmount() when portal closes', () => {
      const props = { open: true, onUnmount: sandbox.spy() }
      wrapperMount(<Portal {...props}><p>Hi</p></Portal>)

      wrapper.setProps({ open: false, children: <p>Hi</p> })
      props.onUnmount.should.have.been.calledOnce()
    })

    it('should not call props.onUnmount() when portal receives props', () => {
      const props = { open: true, onUnmount: sandbox.spy() }
      wrapperMount(<Portal {...props}><p>Hi</p></Portal>)

      wrapper.setProps({ open: false, children: <p>Hi</p>, className: 'old' })
      props.onUnmount.should.have.been.calledOnce()

      wrapper.setProps({ open: false, children: <p>Hi</p>, className: 'new' })
      props.onUnmount.should.have.been.calledOnce()
    })

    it('should call props.onUnmount() only once when portal closes and then is unmounted', () => {
      const div = document.createElement('div')
      const props = { open: true, onUnmount: sandbox.spy() }
      wrapperMount(<Portal {...props}><p>Hi</p></Portal>, { attachTo: div })

      wrapper.setProps({ open: false, children: <p>Hi</p> })
      unmountComponentAtNode(div)
      props.onUnmount.should.have.been.calledOnce()
    })

    it('should call props.onUnmount() only once when directly unmounting', () => {
      const div = document.createElement('div')
      const props = { open: true, onUnmount: sandbox.spy() }

      wrapperMount(<Portal {...props}><p>Hi</p></Portal>, { attachTo: div })
      unmountComponentAtNode(div)
      props.onUnmount.should.have.been.calledOnce()
    })

    it('should not call this.setState() if portal is unmounted', () => {
      const div = document.createElement('div')
      const props = { open: true }
      wrapperMount(<Portal {...props}><p>Hi</p></Portal>, { attachTo: div })

      const spy = sandbox.spy(wrapper, 'setState')
      unmountComponentAtNode(div)
      spy.should.not.have.been.called()
    })
  })

  describe('portal ref', () => {
    it('maintains ref to DOM node with host element', () => {
      wrapperMount(<Portal open><p>Hi</p></Portal>)
      wrapper.instance().portal.tagName.should.equal('P')
    })

    it('maintains ref to DOM node with React component', () => {
      const Component = (props) => <p>Hi</p>

      wrapperMount(<Portal open><Component /></Portal>)
      wrapper.instance().portal.tagName.should.equal('P')
    })
  })

  describe('trigger', () => {
    it('render should return null if no props.trigger', () => {
      wrapperMount(<Portal><p>Hi</p></Portal>)

      expect(wrapper.html()).to.equal(null)
    })

    it('should render the props.trigger element', () => {
      const text = 'open by click on me'
      const trigger = <button>{text}</button>
      wrapperMount(<Portal trigger={trigger}><p>Hi</p></Portal>)

      wrapper.text().should.equal(text)
    })
  })

  describe('mountNode', () => {
    it('render portal within mountNode', () => {
      const mountNode = document.createElement('div')
      document.body.appendChild(mountNode)

      wrapperMount(<Portal mountNode={mountNode} open><p>Hi</p></Portal>)
      const instance = wrapper.instance()

      mountNode.lastElementChild.should.equal(instance.node)
      mountNode.childElementCount.should.equal(1)
    })
  })

  describe('openOnTriggerClick', () => {
    it('should open portal on click by default', () => {
      const spy = sandbox.spy()
      const trigger = <button onClick={spy}>button</button>
      wrapperMount(<Portal trigger={trigger}><p>Hi</p></Portal>)

      wrapper.find('button').simulate('click', nativeEvent)
      document.body.lastElementChild.should.equal(wrapper.instance().node)
      spy.should.have.been.calledOnce()
    })

    it('should not open portal on click when false', () => {
      const spy = sandbox.spy()
      const trigger = <button onClick={spy}>button</button>
      wrapperMount(<Portal trigger={trigger} openOnTriggerClick={false}><p>Hi</p></Portal>)

      wrapper.find('button').simulate('click', nativeEvent)
      document.body.childElementCount.should.equal(0)
      spy.should.have.been.calledOnce()
    })

    it('should open portal on click when set', () => {
      const spy = sandbox.spy()
      const trigger = <button onClick={spy}>button</button>
      wrapperMount(<Portal trigger={trigger} openOnTriggerClick><p>Hi</p></Portal>)

      wrapper.find('button').simulate('click', nativeEvent)
      document.body.lastElementChild.should.equal(wrapper.instance().node)
      spy.should.have.been.calledOnce()
    })
  })

  describe('closeOnTriggerClick', () => {
    it('should not close portal on click', () => {
      const spy = sandbox.spy()
      const trigger = <button onClick={spy}>button</button>
      wrapperMount(<Portal trigger={trigger} defaultOpen><p>Hi</p></Portal>)

      wrapper.find('button').simulate('click', nativeEvent)
      document.body.lastElementChild.should.equal(wrapper.instance().node)
      spy.should.have.been.calledOnce()
    })

    it('should close portal on click when set', () => {
      const spy = sandbox.spy()
      const trigger = <button onClick={spy}>button</button>
      wrapperMount(<Portal trigger={trigger} defaultOpen closeOnTriggerClick><p>Hi</p></Portal>)

      wrapper.find('button').simulate('click', nativeEvent)
      document.body.childElementCount.should.equal(0)
      spy.should.have.been.calledOnce()
    })
  })

  describe('openOnTriggerMouseOver', () => {
    it('should not open portal on mouseover when not set', (done) => {
      const spy = sandbox.spy()
      const trigger = <button onMouseOver={spy}>button</button>
      const mouseOverDelay = 100
      wrapperMount(<Portal trigger={trigger} mouseOverDelay={mouseOverDelay}><p>Hi</p></Portal>)

      wrapper.find('button').simulate('mouseover')
      document.body.childElementCount.should.equal(0)
      spy.should.have.been.calledOnce()

      setTimeout(() => {
        document.body.childElementCount.should.equal(0)
        spy.should.have.been.calledOnce()
        done()
      }, mouseOverDelay + 1)
    })

    it('should open portal on mouseover when set', (done) => {
      const spy = sandbox.spy()
      const trigger = <button onMouseOver={spy}>button</button>
      const mouseOverDelay = 100
      wrapperMount(
        <Portal trigger={trigger} openOnTriggerMouseOver mouseOverDelay={mouseOverDelay}><p>Hi</p></Portal>
      )

      wrapper.find('button').simulate('mouseover')
      setTimeout(() => {
        document.body.childElementCount.should.equal(0)
        spy.should.have.been.calledOnce()
      }, mouseOverDelay - 1)

      setTimeout(() => {
        document.body.lastElementChild.should.equal(wrapper.instance().node)
        spy.should.have.been.calledOnce()
        done()
      }, mouseOverDelay + 1)
    })
  })

  describe('closeOnTriggerMouseLeave', () => {
    it('should not close portal on mouseleave when not set', (done) => {
      const spy = sandbox.spy()
      const trigger = <button onMouseLeave={spy}>button</button>
      const delay = 100
      wrapperMount(<Portal trigger={trigger} defaultOpen mouseLeaveDelay={delay}><p>Hi</p></Portal>)

      wrapper.find('button').simulate('mouseleave')
      setTimeout(() => {
        document.body.lastElementChild.should.equal(wrapper.instance().node)
        spy.should.have.been.calledOnce()
        done()
      }, delay + 1)
    })

    it('should close portal on mouseleave when set', (done) => {
      const spy = sandbox.spy()
      const trigger = <button onMouseLeave={spy}>button</button>
      const delay = 100
      wrapperMount(
        <Portal trigger={trigger} defaultOpen closeOnTriggerMouseLeave mouseLeaveDelay={delay}><p>Hi</p></Portal>
      )

      wrapper.find('button').simulate('mouseleave')
      setTimeout(() => {
        document.body.lastElementChild.should.equal(wrapper.instance().node)
        spy.should.have.been.calledOnce()
      }, delay - 1)

      setTimeout(() => {
        document.body.childElementCount.should.equal(0)
        spy.should.have.been.calledOnce()
        done()
      }, delay + 1)
    })
  })

  describe('closeOnPortalMouseLeave', () => {
    it('should not close portal on mouseleave of portal when not set', (done) => {
      const trigger = <button>button</button>
      const delay = 100
      wrapperMount(<Portal trigger={trigger} defaultOpen mouseLeaveDelay={delay}><p>Hi</p></Portal>)

      domEvent.mouseLeave(wrapper.instance().node.firstElementChild)

      setTimeout(() => {
        document.body.lastElementChild.should.equal(wrapper.instance().node)
        done()
      }, delay + 1)
    })

    it('should close portal on mouseleave of portal when set', (done) => {
      const trigger = <button>button</button>
      const delay = 100
      wrapperMount(
        <Portal trigger={trigger} defaultOpen closeOnPortalMouseLeave mouseLeaveDelay={delay}><p>Hi</p></Portal>
      )

      domEvent.mouseLeave(wrapper.instance().node.firstElementChild)

      setTimeout(() => {
        document.body.lastElementChild.should.equal(wrapper.instance().node)
      }, delay - 1)

      setTimeout(() => {
        document.body.childElementCount.should.equal(0)
        done()
      }, delay + 1)
    })
  })

  describe('closeOnTriggerMouseLeave + closeOnPortalMouseLeave', () => {
    it('should close portal on trigger mouseleave even when portal receives mouseover within limit', (done) => {
      const trigger = <button>button</button>
      const delay = 100
      wrapperMount(
        <Portal trigger={trigger} defaultOpen closeOnTriggerMouseLeave mouseLeaveDelay={delay}><p>Hi</p></Portal>
      )

      wrapper.find('button').simulate('mouseleave')

      // Fire a mouseOver on the portal within the time limit
      setTimeout(() => {
        domEvent.mouseOver(wrapper.instance().node.firstElementChild)
      }, delay - 1)

      // The portal should close because closeOnPortalMouseLeave not set
      setTimeout(() => {
        document.body.childElementCount.should.equal(0)
        done()
      }, delay + 1)
    })

    it('should not close portal on trigger mouseleave when portal receives mouseover within limit', (done) => {
      const trigger = <button>button</button>
      const delay = 100
      wrapperMount(
        <Portal trigger={trigger} defaultOpen closeOnTriggerMouseLeave
          closeOnPortalMouseLeave mouseLeaveDelay={delay}
        ><p>Hi</p></Portal>
      )

      wrapper.find('button').simulate('mouseleave')

      // Fire a mouseOver on the portal within the time limit
      setTimeout(() => {
        domEvent.mouseOver(wrapper.instance().node.firstElementChild)
      }, delay - 1)

      // The portal should not have closed
      setTimeout(() => {
        document.body.lastElementChild.should.equal(wrapper.instance().node)
        done()
      }, delay + 1)
    })
  })

  describe('openOnTriggerFocus', () => {
    it('should not open portal on focus when not set', () => {
      const spy = sandbox.spy()
      const trigger = <button onFocus={spy}>button</button>
      wrapperMount(<Portal trigger={trigger}><p>Hi</p></Portal>)

      wrapper.find('button').simulate('focus')
      document.body.childElementCount.should.equal(0)
      spy.should.have.been.calledOnce()
    })

    it('should open portal on focus when set', () => {
      const spy = sandbox.spy()
      const trigger = <button onFocus={spy}>button</button>
      wrapperMount(<Portal trigger={trigger} openOnTriggerFocus><p>Hi</p></Portal>)

      wrapper.find('button').simulate('focus')
      document.body.lastElementChild.should.equal(wrapper.instance().node)
      spy.should.have.been.calledOnce()
    })
  })

  describe('closeOnTriggerBlur', () => {
    it('should not close portal on blur when not set', () => {
      const spy = sandbox.spy()
      const trigger = <button onBlur={spy}>button</button>
      wrapperMount(<Portal trigger={trigger} defaultOpen><p>Hi</p></Portal>)

      wrapper.find('button').simulate('blur')
      document.body.lastElementChild.should.equal(wrapper.instance().node)
      spy.should.have.been.calledOnce()
    })

    it('should close portal on blur when set', () => {
      const spy = sandbox.spy()
      const trigger = <button onBlur={spy}>button</button>
      wrapperMount(<Portal trigger={trigger} defaultOpen closeOnTriggerBlur><p>Hi</p></Portal>)

      wrapper.find('button').simulate('blur')
      document.body.childElementCount.should.equal(0)
      spy.should.have.been.calledOnce()
    })
  })

  describe('close actions', () => {
    it('closeOnEscape', () => {
      wrapperMount(<Portal closeOnEscape defaultOpen><p>Hi</p></Portal>)
      document.body.childElementCount.should.equal(1)

      domEvent.keyDown(document, { key: 'Escape' })
      document.body.childElementCount.should.equal(0)
    })

    it('closeOnDocumentClick', () => {
      wrapperMount(<Portal closeOnDocumentClick defaultOpen><p>Hi</p></Portal>)
      document.body.childElementCount.should.equal(1)

      // Should not close when click inside
      domEvent.click(wrapper.instance().node.firstElementChild)
      document.body.childElementCount.should.equal(1)

      domEvent.click(document)
      document.body.childElementCount.should.equal(0)
    })

    it('closeOnRootNodeClick', () => {
      wrapperMount(<Portal closeOnDocumentClick={false} closeOnRootNodeClick defaultOpen><p>Hi</p></Portal>)
      document.body.childElementCount.should.equal(1)

      // Should not close when click inside
      domEvent.click(wrapper.instance().node.firstElementChild)
      document.body.childElementCount.should.equal(1)

      // Should not close when click on body
      domEvent.click(document.body)
      document.body.childElementCount.should.equal(1)

      domEvent.click(wrapper.instance().node.firstElementChild.parentNode)
      document.body.childElementCount.should.equal(0)
    })
  })
})
