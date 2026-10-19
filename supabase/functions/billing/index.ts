// Safe default: no payment sessions are created. Deploy only after production review.
// Secrets belong in Supabase Edge Function secrets, never VITE_* variables.
Deno.serve((request:Request)=>{
 if(request.method!=='POST')return new Response('Method not allowed',{status:405});
 return Response.json({error:'Billing is not activated. Checkout, portal and verified webhook integration require deployment configuration and explicit owner approval.'},{status:503});
});
