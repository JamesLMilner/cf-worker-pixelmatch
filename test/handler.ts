import { expect } from 'chai'
import { handleRequest } from '../src/handler'
import { readFileSync } from 'fs'

describe('None POST requests should fail', () => {
  const methods = [
    'GET',
    'HEAD',
    'PUT',
    'DELETE',
    'CONNECT',
    'OPTIONS',
    'TRACE',
    'PATCH',
  ]
  methods.forEach(method => {
    it(method, async () => {
      const result = await handleRequest(new Request('/', { method }))
      const {status} = await result;
      expect(status).to.equal(status);
    })
  })
})

describe('POST Request', async () => {

  it('returns 400 with no body', async () => {
    const result = await handleRequest(new Request('/', { method: "POST", body: "{}" }))
    expect(result.status).to.equal(400);
    expect(await result.text()).equal("Requires correctly formed JSON payload");
  })

  it('returns 400 when imgOne and imgTwo are not defined', async () => {
    const result = await handleRequest(new Request('/', { 
      method: "POST", 
      body: JSON.stringify({
        imgOne: '',
        imgTwo: ''
      })
    }))
    expect(result.status).to.equal(400);
    expect(await result.text()).equal("Requires correctly formed JSON payload");
  })

  it('returns 400 when imgOne and imgTwo are not pngs', async () => {
    const result = await handleRequest(new Request('/', { 
      method: "POST", 
      body: JSON.stringify({
        imgOne: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD',
        imgTwo: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAA'
      })
    }))
    expect(result.status).to.equal(400);
    expect(await result.text()).equal("Both images need to be a base64 encoded PNG");
  })

  describe('200', () => {

    it('when imgOne and imgTwo are pngs', async () => {
      const result = await handleRequest(new Request('/', { 
        method: "POST", 
        body: JSON.stringify({
          imgOne: readFileSync(__dirname + '/../../test/fixtures/img1.txt').toString(),
          imgTwo: readFileSync(__dirname + '/../../test/fixtures/img2.txt').toString()
        })
      }))

      const json = await result.json()
      expect(json.mismatch).equal(106);
      expect(json.diff.length).equal(34104);
      expect(result.status).to.equal(200);
    })

  })

})
