(async ()=>{
  try{
  const res = await fetch('http://localhost:4000/graphql',{
      method:'POST',
      headers:{'content-type':'application/json'},
      body: JSON.stringify({ query: `mutation Login { login(email:\"mara@gmail.com\", password:\"password\") { token user { id name email role } } }` })
    })
  const json = await res.json()
    console.log(JSON.stringify(json,null,2))
  }catch(err){
    console.error(err)
    process.exit(1)
  }
})()
