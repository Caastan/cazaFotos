import { collectionGroup, query, where, getDocs } from 'firebase/firestore';

useEffect(()=>{
  if(!user) return;
  (async()=>{
    // members where i'm
    const q = query(
      collectionGroup(db,'miembros'),
      where('userId','==',user.id)
    );
    const snap = await getDocs(q);
    const idsAdmin=[], idsPart=[];
    snap.forEach(d=>{
      const cid = d.ref.parent.parent.id;      // id del concurso
      d.data().rol==='admin' ? idsAdmin.push(cid) : idsPart.push(cid);
    });

    if(idsAdmin.length){
      const cs=await getDocs(query(collection(db,'concursos'),
                       where('__name__','in',idsAdmin)));
      setAdmins(cs.docs.map(d=>({id:d.id,...d.data()})));
    }
    if(idsPart.length){
      const cs=await getDocs(query(collection(db,'concursos'),
                       where('__name__','in',idsPart)));
      setParticip(cs.docs.map(d=>({id:d.id,...d.data()})));
    }
  })();
},[user]);