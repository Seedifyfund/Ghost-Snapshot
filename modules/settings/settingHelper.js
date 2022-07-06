const settingModel = require('./settingModel');


exports.addSnapshotEmail = async (emailsList) => {
    let newEmailList;
    const oldEmailsList = await this.getSnapshotEmails();

    if(oldEmailsList){
        newEmailList = await settingModel.updateOne({}, {$addToSet:{ seedifyMailAddress : emailsList}});
    }
    else{
        newEmailList = await settingModel.create({ seedifyMailAddress : emailsList, ccMailAddress: [] });
    }

    return newEmailList;
}

exports.addccEmail = async (emailsList) => {
    let newEmailList;
    const oldEmailsList = await this.getccEmails();

    if(oldEmailsList){
        newEmailList = await settingModel.updateOne({}, {$addToSet:{ ccMailAddress : emailsList}});
    }
    else{
        newEmailList = await settingModel.create({ ccMailAddress : emailsList, seedifyMailAddress: [] });
    }

    return newEmailList;
}

exports.getSnapshotEmails = async () => {
    const snapshotEmails = await settingModel.find({}, ['seedifyMailAddress']);
    if(!snapshotEmails.length)
        return undefined;

    return snapshotEmails[0].seedifyMailAddress;
}

exports.getccEmails = async () => {
    const ccEmails = await settingModel.find({}, ['ccMailAddress']);
    if(!ccEmails.length)
        return undefined;

    return ccEmails[0].ccMailAddress;
}

// module.exports = settingHelper;

