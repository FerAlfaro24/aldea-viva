import {it,expect} from 'vitest';
import {writeFileSync,mkdirSync} from 'node:fs';
import {generateVillage} from '../../src/game/generation/village';
import {advanceVillageDays} from '../../src/game/core/workDay';
import {applyRecommendedWork,applyWorkAdjustments} from '../../src/game/commands/recommendedWork';
import {prepareConstruction,changeConstruction} from '../../src/game/commands/construction';
import {configureMaintenance} from '../../src/game/commands/maintenance';
import {expandVillage,selectExpansion} from '../../src/game/commands/expansion';
import {resolveBanditAttack} from '../../src/game/commands/defense';
import {resolveStory} from '../../src/game/commands/story';
import {configureEconomy} from '../../src/game/commands/economy';
import {selectGuidance} from '../../src/game/selectors/guidance';
import {selectWinterPlan} from '../../src/game/selectors/planning';
import {selectEconomyPolicy} from '../../src/game/selectors/economy';
import {selectDefenseOptions} from '../../src/game/selectors/defense';
import {selectStoryOptions,visitorFreeBeds} from '../../src/game/selectors/story';
import {isGameOver} from '../../src/game/selectors/survival';
import {parseSave,createSave} from '../../src/storage/schema';

it('primer año guiado en seis aldeas, sin recursos regalados',()=>{
 mkdirSync('.tools.local',{recursive:true});
 const results=[];
 for(const seed of ['opinion-jugador-2026-11-02','analisis-inicio-7','analisis-inicio-14','analisis-inicio-0','analisis-inicio-20','analisis-inicio-31']){
  let w=generateVillage(seed);const population=w.residents.length,actions=[],warnings=[];let reopened=false;
  for(let iteration=0;iteration<1800&&w.elapsedDays<336&&!isGameOver(w);iteration++){
   if(w.pendingDecision?.type==='bandit_attack'){
    const options=selectDefenseOptions(w).filter(o=>!o.unavailable);
    const negotiation=options.find(o=>o.tactic==='negotiate');
    const choice=negotiation&&w.inventory.food-negotiation.foodCost>=selectWinterPlan(w).foodTarget*.85?'negotiate':'defend';
    w=resolveBanditAttack(w,w.pendingDecision.id,options.some(o=>o.tactic===choice)?choice:options[0].tactic);continue;
   }
   if(w.pendingDecision?.type==='story_event'){
    const event=w.story.pending,options=selectStoryOptions(w).filter(o=>!o.unavailable);
    const desired=event.kind==='visitors'?(visitorFreeBeds(w)>=event.residents.length?'accept':'reject'):event.kind==='urgent-repair'?'reinforce':w.inventory.food>100?'careful':'decline';
    w=resolveStory(w,event.id,(options.find(o=>o.choice===desired)??options[0]).choice);continue;
   }
   const advice=selectGuidance(w).advice;
   if(actions.length<120)actions.push({day:w.elapsedDays,title:advice.title,action:advice.action});
   if(advice.action==='adjust'){const next=applyWorkAdjustments(w);expect(next).not.toBe(w);w=next;continue;}
   if(advice.action==='work'){const next=applyRecommendedWork(w);if(next!==w){w=next;continue;}warnings.push({day:w.elapsedDays,title:advice.title});}
   if(advice.action==='build'){w=prepareConstruction(w,advice.plotId,advice.buildingType);continue;}
   if(advice.action==='delivery'){w=configureEconomy(w,{...selectEconomyPolicy(w),deliveryPriority:'wood'});continue;}
   if(advice.action==='plot'){
    const project=w.constructionProjects?.find(p=>p.slotId===advice.plotId);
    if(project?.status==='paused')w=changeConstruction(w,project.id,'resume');
    else{const building=w.buildings.find(b=>b.slotId===advice.plotId);if(building)w=configureMaintenance(w,building.id,'high');}
   }
   if(advice.route==='buildings'&&selectExpansion(w).allowed){w=expandVillage(w);continue;}
   if(advice.route==='defense')w=applyRecommendedWork(w);
   const needsFoodRecovery=w.residents.some(p=>p.alive&&(p.condition.hunger>=25||p.condition.health<75));
   if(!needsFoodRecovery&&selectEconomyPolicy(w).ration==='abundant')w=configureEconomy(w,{...selectEconomyPolicy(w),ration:'normal'});
   if(advice.route==='survival'&&needsFoodRecovery&&w.inventory.food>selectWinterPlan(w).foodTarget*1.2)w=configureEconomy(w,{...selectEconomyPolicy(w),ration:'abundant'});
   const days=advice.action==='advance'&&advice.days===7&&336-w.elapsedDays>=7?7:1;
   w=advanceVillageDays(w,days).state;
   if(!reopened&&w.elapsedDays>=168){w=parseSave(createSave(w,1,1,'2026-11-03T00:00:00Z')).village;reopened=true;}
  }
  const living=w.residents.filter(p=>p.alive);
  const row={seed,population,day:w.elapsedDays,living:living.length,food:w.inventory.food,wood:w.inventory.wood,grade:w.grade,
   warehouses:w.buildings.filter(b=>b.type==='warehouse').length,plotsFree:w.constructionSlots.filter(s=>!s.buildingId).length,
   hunger:living.reduce((s,p)=>s+p.condition.hunger,0)/Math.max(1,living.length),health:living.reduce((s,p)=>s+p.condition.health,0)/Math.max(1,living.length),
   stories:w.chronicle.filter(e=>e.type==='story_resolved').length,raids:w.chronicle.filter(e=>e.type==='bandit_resolved').length,
   talents:w.chronicle.filter(e=>e.type==='talent_discovered').length,warnings,actions,reopened};
  results.push(row);writeFileSync('.tools.local/primer-ano-mejorado.json',JSON.stringify(results,null,2));
  writeFileSync('.tools.local/primer-ano-estado-'+seed+'.json',JSON.stringify(createSave(w,1,1,'2026-11-03T00:00:00Z')));
  expect(row.day,JSON.stringify({...row,actions:undefined})).toBe(336);
  expect(row.living).toBeGreaterThanOrEqual(population);expect(row.warehouses).toBeLessThanOrEqual(4);expect(row.warnings).toHaveLength(0);
  expect(row.hunger).toBe(0);expect(row.health).toBeGreaterThan(90);expect(row.plotsFree).toBeGreaterThan(0);
 }
},60000);

