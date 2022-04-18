function getVar(name: string): string {
  name = `VITE_` + name
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const env = window[`eyecue_env` as any] as any
  return env ? env[name] : import.meta.env[name]
}

const ENV = {
  MIRAGE: getVar(`MIRAGE`),
}

export default ENV
