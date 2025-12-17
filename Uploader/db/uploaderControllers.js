const db = require('../../models');
// const configArrays = require('../config/configArrays');
// const deduplicateSubsidies = require('../Deduplicator');
// const { handleDateLIHTC } = require('../utils');
// const { getAgenciesForHierarchyCompare } = require('./helpers');

const handleNewRecord = async ({
  newSubsidy,
  propertyId,
  // newFundingSrc,
  // newResidentArr,
  userId,
  agencyId,
  uploadId
}) => {
  try {
    const dbSubsidy = await db.Subsidy.create({
      ...newSubsidy,
      property_id: propertyId,
      user_id: userId,
      // funding_sources: '',
      agency_id: agencyId,
      uploads: [uploadId],
      deduplicated_subsidies: []
    });

    await db.Property.updateOne(
      { _id: propertyId },
      { $push: { subsidies: dbSubsidy._id } }
    );

    // for await (const source of Object.values(newFundingSrc)) {
    //   if (source) {
    //     const dbFundingSource = await db.FundingSource.create({
    //       source: source,
    //       subsidy_id: dbSubsidy._id,
    //       user_id: userId,
    //       agency_id: agencyId,
    //       uploads: [uploadId]
    //     });

    //     await db.Subsidy.updateOne(
    //       { _id: dbSubsidy._id },
    //       {
    //         $push: { funding_sources: dbFundingSource._id }
    //       }
    //     );
    //   }
    // }

    // for await (const item of newResidentArr) {
    //   if (item || item.toUpperCase() !== 'RENTER') {
    //     await db.Resident.create({
    //       type: item,
    //       subsidy_id: dbSubsidy._id,
    //       user_id: userId,
    //       agency_id: agencyId,
    //       uploads: [uploadId]
    //     });
    //   }
    // }
  } catch (err) {
    console.log(err);
  }
};

// const handleUpdateType = async ({
//   updateObj,
//   existingOwner,
//   newOwnerObj,
//   ownerUpdateObj,
//   property,
//   newProperty,
//   propertyUpdateObj,
//   existingResident,
//   residentUpdateObj,
//   uploadId
// }) => {
//   switch (updateObj.type) {
//     case 'update_all':
//       if (existingOwner.name !== newOwnerObj.name)
//         await db.Owner.findByIdAndUpdate(existingOwner._id, ownerUpdateObj);

//       if (
//         property.total_units !== newProperty.total_units &&
//         newProperty.total_units
//       )
//         await db.Property.findByIdAndUpdate(property._id, propertyUpdateObj);

//       if (
//         existingResident &&
//         residentUpdateObj &&
//         residentUpdateObj.type.toUpperCase() !== 'RENTER'
//       )
//         db.Resident.findByIdAndUpdate(existingResident._id, residentUpdateObj);
//       break;

//     case 'update_null':
//       if (!existingOwner.name && newOwnerObj.name)
//         await db.Owner.findByIdAndUpdate(existingOwner._id, ownerUpdateObj);

//       if (!property.total_units && newProperty.total_units)
//         await db.Property.findByIdAndUpdate(property._id, propertyUpdateObj);
//       break;

//     case 'update_hierarchy':
//       const { existingAgency, newAgency } =
//         await getAgenciesForHierarchyCompare(
//           updateObj.existingAgencyId,
//           uploadId
//         );
//       const newAgencyHasPriority =
//         configArrays.agencyHierarchy.indexOf(newAgency) <
//         configArrays.agencyHierarchy.indexOf(existingAgency);

//       if (
//         (!existingOwner.name && newOwnerObj.name) ||
//         (newOwnerObj.name && newAgencyHasPriority)
//       )
//         await db.Owner.findByIdAndUpdate(existingOwner._id, ownerUpdateObj);

//       if (
//         (!property.total_units && newProperty.total_units) ||
//         (newProperty.total_units && newAgencyHasPriority)
//       )
//         await db.Property.findByIdAndUpdate(property._id, propertyUpdateObj);

//       if (
//         existingResident &&
//         residentUpdateObj &&
//         residentUpdateObj.type.toUpperCase() !== 'RENTER' &&
//         newAgencyHasPriority
//       )
//         await db.Resident.findByIdAndUpdate(
//           existingResident._id,
//           residentUpdateObj
//         );
//       break;

//     default:
//       break;
//   }
// };

// const updateRelatedCollections = async props => {
//   const {
//     property,
//     newProperty,
//     updateObj,
//     existingOwner,
//     newOwnerObj,
//     newResidentArr,
//     uploadId,
//     userId
//   } = props;

//   const existingResident = await db.Resident.findOne({
//     subsidy_id: updateObj.existingSubId
//   });

//   const ownerUpdateObj = { ...newOwnerObj };
//   const propertyUpdateObj = {
//     total_units: newProperty.total_units
//   };
//   const residentUpdateObj = newResidentArr
//     .filter(value => value)
//     .map(item => ({
//       type: item,
//       subsidy_id: updateObj.existingSubId
//     }))[0];

//   if (
//     !existingResident &&
//     residentUpdateObj &&
//     residentUpdateObj.type.toUpperCase() !== 'RENTER'
//   )
//     db.Resident.create({
//       ...residentUpdateObj,
//       uploads: [uploadId],
//       user_id: userId
//     });

//   [ownerUpdateObj, propertyUpdateObj, residentUpdateObj].forEach(obj => {
//     if (obj) {
//       obj.updated_on = new Date();
//       obj.user_id = userId;

//       if (!property.uploads.includes(uploadId))
//         obj.$push = { uploads: uploadId };
//     }
//   });

//   await handleUpdateType({
//     ...props,
//     existingOwner,
//     ownerUpdateObj,
//     propertyUpdateObj,
//     existingResident,
//     residentUpdateObj
//   });
// };

// const handleDuplicatesAndUpdate = async props => {
//   const { existingSubsArr } = props;

//   const updateObj = { updated: false };

//   for await (const subsidyId of existingSubsArr) {
//     props.existingSubId = subsidyId;

//     const { update, type, existingAgencyId } = await deduplicateSubsidies(
//       props
//     );
//     console.log('Subsidy deduplicated and updated.');

//     updateObj.updated = update;
//     updateObj.type = type;
//     updateObj.existingAgencyId = existingAgencyId;
//     updateObj.existingSubId = subsidyId;
//   }

//   if (updateObj.updated) {
//     await updateRelatedCollections({ ...props, updateObj });
//     console.log('Collections related to subsidy updated.');
//   }

//   return updateObj.updated;
// };

module.exports = {
  async initializeDbUpload(userId, agency, filename, dropFirst) {
    if (dropFirst === 'dropFirst12345') {
      await db.User.updateMany({}, { uploads: [] });
      await db.Agency.updateMany({}, { uploads: [] });
      await db.Upload.deleteMany({});
      await db.Owner.deleteMany({});
      await db.Property.deleteMany({});
      await db.Subsidy.deleteMany({});
      await db.FundingSource.deleteMany({});
      await db.Resident.deleteMany({});
      await db.DeduplicatedSubsidy.deleteMany({});
      console.log('DB cleared');
    }

    const dbUser = await db.User.findById(userId);
    if (!dbUser) throw new Error(`No User - ${userId}`);

    const dbAgency = await db.Agency.findOne({ name: agency });
    if (!dbAgency) throw new Error(`No Agency Match in DB`);

    const dbUpload = await db.Upload.create({
      original_filename: filename,
      new_filename: filename,
      user_id: dbUser._id,
      agency_id: dbAgency._id
    });

    await db.User.updateOne(
      { _id: dbUser._id },
      { $push: { uploads: dbUpload._id }, updated_on: new Date() }
    );

    await db.Agency.updateOne(
      { _id: dbAgency._id },
      { $push: { uploads: dbUpload._id }, updated_on: new Date() }
    );

    const allAgenciesInfo = await db.Agency.find({});

    return {
      userId: dbUser._id,
      agencyId: dbAgency._id,
      uploadId: dbUpload._id,
      allAgenciesInfo
    };
  },
  async handleCollectionsInsert(
    userId,
    agencyId,
    uploadId,
    {
      Property,
      Subsidy,
      allAgenciesInfo
    }
  ) {
    const existingProperty = await db.Property.findOne({
      address: Property.address
    });

    const agencyHierarchy = [
      'Atlanta Housing',
      'City of Atlanta',
      'Invest Atlanta',
      'Georgia Department of Community Affairs',
      'National Housing Preservation Database',
    ];

    const indexOfNewAgency = agencyHierarchy.indexOf(allAgenciesInfo.find(agency => agency?._id.toString() === agencyId?.toString())?.name);
    const indexOfExistingAgency = existingProperty
      ? agencyHierarchy.indexOf(allAgenciesInfo.find(agency => agency._id?.toString() === existingProperty?.agency_id?.toString())?.name)
      : agencyHierarchy.length;

    const isTrustedAgency = existingProperty?.agency_id?.toString() === agencyId?.toString() ||
      indexOfNewAgency < indexOfExistingAgency;

    const dbProperty = !existingProperty
      ? await db.Property.create({
        ...Property,
        user_id: userId,
        agency_id: agencyId,
        subsidies: [],
        upload_id: uploadId,
        uploads: [uploadId]
      })
      : isTrustedAgency
        ? await db.Property.findByIdAndUpdate(existingProperty._id, {
          ...Property,
          updated_on: new Date(),
          user_id: userId,
          $push: { uploads: uploadId }
        })
        : existingProperty;
      
      const existingSubs = dbProperty.subsidies || [];
      console.log(`Updating subsidies for property: ${dbProperty._id}`);

      const existingSubsRecords = existingSubs[0]
        ? await db.Subsidy.find({
          _id: { $in: existingSubs }
        })
        : [];


      if (existingSubsRecords[0]) {

        const matchedByFundingSource = existingSubsRecords
          .filter(sub => sub.funding_sources === Subsidy.funding_sources)

        const matchedByFundingSourceStartDate = matchedByFundingSource
          .filter(sub => {
            const start = sub.start_date;
            return start !== '' && start !== null;
          })
          .filter(sub => {
            const start = sub.start_date;
            const newStart = Subsidy.start_date;
            const sixMonthsInMs = 6 * 30 * 24 * 60 * 60 * 1000; // 6 months in milliseconds
            const startWithin6Months = Math.abs(start.getTime() - newStart.getTime()) <= sixMonthsInMs;
            return startWithin6Months;
          });

        if (matchedByFundingSourceStartDate[0]) {
          // Replace most recent update with new data, delete older records, 
          // and delete expired records of same funding source

          console.log('Subsidies of same funding source within 6 months of start date found:', matchedByFundingSourceStartDate);
          const newestMatch = matchedByFundingSourceStartDate.reduce((acc, curr) => {
            const accDate = new Date(acc.updated_on);
            const currDate = new Date(curr.updated_on);
            return accDate > currDate ? acc : curr;
          });

          const updateObject = {
            ...Object.fromEntries(
              Object.entries(Subsidy).filter(
                ([_, value]) => value !== null && value !== ''
              )
            ),
            updated_on: new Date(),
            user_id: userId,
            $push: { uploads: uploadId }
          };

          await db.Subsidy.findByIdAndUpdate(newestMatch._id,  updateObject);

          console.log('Subsidy updated:', newestMatch._id)

          // Delete older matched subsidies
          const olderMatchedSubsidies = matchedByFundingSourceStartDate.filter(sub => sub._id !== newestMatch._id);
          for await (const sub of olderMatchedSubsidies) {
            console.log('Deleting older matched subsidies:', sub);
            await db.Subsidy.findByIdAndDelete(sub._id);
            await db.Property.findByIdAndUpdate(dbProperty._id, {
              $pull: { subsidies: sub._id }
            });
          }

          const expiredMatchBySource = matchedByFundingSource
          .filter(sub => {  
            !olderMatchedSubsidies.includes(sub) && sub._id !== newestMatch._id;
          })
          .filter(sub => {
            const end = sub?.end_date;
            const start = sub?.start_date;
            const newStart = Subsidy.start_date;
            // const start_date = Subsidy.start_date;
            return (end && end.getTime() <= new Date().getTime()) || (newStart.getTime() - start.getTime()  > 6 * 30 * 24 * 60 * 60 * 1000);
          });

          for await (const sub of expiredMatchBySource) {
            console.log('Deleting expired subsidies:', sub);
            await db.Subsidy.findByIdAndDelete(sub._id);
            await db.Property.findByIdAndUpdate(dbProperty._id, {
              $pull: { subsidies: sub._id }
            });
          }
          
        } else if (matchedByFundingSource[0]) {
          const isNewer = matchedByFundingSource.reduce((acc, curr) => {
            const accDate = new Date(acc.start_date);
            const currDate = new Date(curr.start_date);
            return accDate > currDate ? acc : curr;
          } , { updated_on: new Date(0) });

          if (isNewer.updated_on.getTime() > new Date(Subsidy.updated_on).getTime()) {
            console.log('New subsidy is older than the existing subsidies:', isNewer);
            // Keep only newest record
            for await (const sub of matchedByFundingSource) {
              if (sub._id !== isNewer._id) {
                console.log('Deleting older subsidies:', sub);
                await db.Subsidy.findByIdAndDelete(sub._id);
                await db.Property.findByIdAndUpdate(dbProperty._id, {
                  $pull: { subsidies: sub._id }
                });
              }
            };

            return;
          }

          const updateObject = {
            ...Object.fromEntries(
              Object.entries(Subsidy).filter(
                ([_, value]) => value !== null && value !== ''
              )
            ),
            updated_on: new Date(),
            user_id: userId,
            $push: { uploads: uploadId }
          };

          await db.Subsidy.findByIdAndUpdate({ _id: isNewer._id }, updateObject);

          console.log('Subsidy updated:', isNewer._id)
          
          for await (const sub of matchedByFundingSource) {
            if (sub._id !== isNewer._id) {
              console.log('Deleting older subsidies:', sub);
              await db.Subsidy.findByIdAndDelete(sub._id);
              await db.Property.findByIdAndUpdate(dbProperty._id, {
                $pull: { subsidies: sub._id }
              });
            }
          } 
          // const expiredMatchBySource = matchedByFundingSource
          // .filter(sub => {  
          //   !olderMatchedSubsidies.includes(sub) && sub._id !== newestMatch._id;
          // })
          // .filter(sub => {
          //   const end = sub?.end_date;
          //   const start = sub?.start_date;
          //   const newStart = Subsidy.start_date;
          //   // const start_date = Subsidy.start_date;
          //   return (end && end.getTime() <= new Date().getTime()) || (newStart.getTime() - start.getTime()  > 6 * 30 * 24 * 60 * 60 * 1000);
          // });

          // for await (const sub of expiredMatchBySource) {
          //   console.log('Deleting expired subsidies:', sub);
          //   await db.Subsidy.findByIdAndDelete(sub._id);
          //   await db.Property.findByIdAndUpdate(dbProperty._id, {
          //     $pull: { subsidies: sub._id }
          //   });
          // }
        } else {
          await handleNewRecord({
            newSubsidy: Subsidy,
            propertyId: dbProperty._id,
            userId,
            agencyId,
            uploadId
          });
        }
      } else {
        // Add New Subsidy
        const dbSubsidy = await db.Subsidy.create({
          ...Subsidy,
          property_id: dbProperty._id,
          user_id: userId,
          agency_id: agencyId,
          uploads: [uploadId],
          deduplicated_subsidies: []
        });
        // Update Property with new Subsidy ID
        await db.Property.findByIdAndUpdate(dbProperty._id, {
          $push: { subsidies: dbSubsidy._id }
        });
      }
    }
  };
