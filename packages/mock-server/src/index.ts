import proxy from './proxy'

const options = {
  addr: '0.0.0.0',
  proxyProt: parseInt(process.argv[2]) || 7777
}

proxy.start({ port: options.proxyProt })
