const {
  DTD_CONTENT,
  DTD_CP_TYPE,
  DTD_ACTION_END,
  HL7_TRANSLATION,
  DTD_PRIMARY_CAREPLAN,
  DTD_INSTRUCTION_TRANSLATION,
} =  require('./extension');
const { flatten, uniqBy } =  require('lodash');
const  { DecodeDateRange, fullUrlToId } = require('./common-helper');


const DecodeCarePlan = (carePlanBundle) => {
  const carePlan = carePlanBundle.entry?.find((row) => row.resource.resourceType === 'CarePlan');
  const planDefinitions = carePlanBundle.entry?.filter((row) => row.resource.resourceType === 'PlanDefinition');
  const encounter = carePlanBundle.entry?.find((row) => row.resource.resourceType === 'Encounter');
  const procedureResource = carePlanBundle.entry?.find((row) => row.resource.resourceType === 'Procedure');
  const episodeOfCare = carePlanBundle.entry?.find((row) => row.resource.id === encounter.resource.episodeOfCare[0].identifier.value);
  const condition = carePlanBundle.entry?.find((row) => row.resource.id === encounter.resource.diagnosis[0].condition.identifier.value);
  const patient = carePlanBundle.entry?.find((row) => row.resource.resourceType === 'Patient');
  const diagnosis = condition?.resource.code.coding[0];
  const procedure = procedureResource?.resource.code.coding[0];

  const questionnaires = carePlanBundle.entry?.filter((row) => row.resource.resourceType === 'QuestionnaireResponse');

  const questionnaireResponses = flatten(
    questionnaires.map((questionnaire) => {
      return uniqBy(
        questionnaire.resource.item.map((item) => ({
          id: fullUrlToId(questionnaire.resource.questionnaire),
          date:item.extension.find((extension) => extension.url === DTD_PERFORMED_DATE)?.valueDateTime || '',
        })),
        'date'
      );
    })
  );
  const observations = carePlanBundle.entry?.filter((obj) => obj?.resource?.resourceType === 'Observation');


  let lmp, edd;
  if (observations?.length) {
    observations.forEach((obj) => {
      if (obj?.resource?.effectiveDateTime) {
        if (obj?.resource?.code?.coding[0]?.code === '8665-2') {
          lmp = new Date(obj.resource.effectiveDateTime);
        }
        if (obj?.resource?.code?.coding[0]?.code === '8665-3') {
          edd = new Date(obj.resource.effectiveDateTime);
        }
      }
    });
  }

  const entryBundle = carePlanBundle.entry;

  const admissionDate = episodeOfCare?.resource.period.start;
  const dischargeDate = episodeOfCare?.resource.period.end;
  const surgeryDate = procedureResource?.resource.performedDateTime;
  const childDOB = patient?.resource?.birthDate;



  return {
    diagnosis: {
      value: diagnosis?.code,
      label: diagnosis?.display,
    },
    emr: episodeOfCare?.resource.identifier[0].value,
    eocProcedure: {
      value: procedure?.code,
      label: procedure?.display,
    },
    serviceType: encounter?.resource.serviceType.coding[0].code,
    admissionDate: admissionDate ? new Date(admissionDate) : undefined,
    dischargeDate: dischargeDate ? new Date(dischargeDate) : undefined,
    surgeryDate: surgeryDate ? new Date(surgeryDate) : undefined,
    childDOB: childDOB ? new Date(childDOB) : undefined,
    lmp,
    edd,
    entryBundle,
    procedure: carePlan?.resource.contained.map((carePlanRow) => {
      const planDefinition = planDefinitions.find((row) => row.resource.id === fullUrlToId(carePlanRow.instantiatesCanonical[0]));
      const components = carePlanRow.activity.filter((row) => {
          return carePlanBundle.entry?.find((bundleRow) => bundleRow.fullUrl === row.detail.instantiatesCanonical);
        })
        .map((row) => {
          const bundleElement = carePlanBundle.entry?.find((bundleRow) => bundleRow.fullUrl === row.detail.instantiatesCanonical);
          const referenceElement = carePlanBundle.entry?.find((bundleRow) => bundleRow.resource.id === row.reference?.identifier.value);
          const parentElement = carePlanBundle.entry?.find((bundleRow) => fullUrlToId(bundleRow.resource.instantiatesCanonical || '') === bundleElement.resource.id ||
                fullUrlToId(bundleElement.resource.derivedFrom ? bundleElement.resource.derivedFrom[0] : '') === bundleRow.resource.id
          );

          return {
            id: bundleElement.resource.id,
            refId: parentElement?.resource.id,
            dateRange: DecodeDateRange(
              referenceElement?.resource.occuranceTiming?.repeat.boundsPeriod ||
                referenceElement?.resource.occurrencePeriod ||
                referenceElement?.resource.executionPeriod ||
                bundleElement.resource.effectivePeriod
            ),
            period: {
              code: row.detail.scheduledTiming.code?.coding[0].code,
              boundsDuration: row.detail.scheduledTiming.repeat.boundsDuration,
              offset: row.detail.scheduledTiming.repeat.offset,
              whenTiming: row.detail.scheduledTiming.repeat.whenTiming,
              actionEnd: row.detail.scheduledTiming.extension?.find((extension) => extension.url === DTD_ACTION_END)?.valueString,
            },
            type: bundleElement.resource.kind || bundleElement.resource.resourceType,
            title: bundleElement.resource.title || bundleElement.resource.payload.find((payload) => payload.attachment).attachment.title,
            topic: bundleElement.resource.topic
              ? bundleElement.resource.topic[0].coding[0].code
              : bundleElement.resource.code?.coding
              ? bundleElement.resource.code.coding[0].code
              : bundleElement.resource.category
              ? bundleElement.resource.category[0].coding[0].code
              : bundleElement.resource.code[0],
            attachment: bundleElement.resource.payload?.find((row) => row.attachment)?.attachment,
          };
        });

      const libraryId = planDefinition?.resource.relatedArtifact?.[0].resource.identifier.value;
      const educationLibrary = carePlanBundle.entry?.find((row) => row.resource.id === libraryId);
      const library = educationLibrary
        ? {
            id: educationLibrary.resource.id || '',
            title: educationLibrary.resource.content[0].attachment?.title || '',
            url: educationLibrary.resource.content[0].attachment?.url || '',
            instruction:
              educationLibrary?.resource.extension
                ?.find((row) => row.url === DTD_INSTRUCTION_TRANSLATION)
                ?.extension?.find((row) => row.url === HL7_TRANSLATION)
                ?.extension?.find( (row) => row.url === DTD_CONTENT )?.valueString || '',
          }
        : undefined;

      return {
        title: planDefinition?.resource.title || '',
        type: (planDefinition?.resource?.type?.coding[0]?.code || 'procedure'),
        carePlanAddDate: new Date(carePlanRow.meta.lastUpdated),
        startDate: new Date(carePlanRow.period?.start || ''),
        endDate: new Date(carePlanRow.period?.end || ''),
        primary: carePlanRow.extension.find((extension) => extension.url === DTD_PRIMARY_CAREPLAN)?.valueBoolean,
        components: components,
        status: carePlanRow.status,
        cpType: carePlanRow.extension?.find((row) => row.url === DTD_CP_TYPE)?.valueString,
        library,
      };
    }),
    questionnaireResponses
  };
};

module.exports = { DecodeCarePlan }