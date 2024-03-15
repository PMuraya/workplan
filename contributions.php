<?php
namespace mutall\capture;

include '../../../schema/v/code/schema.php';
include '../../../schema/v/code/questionnaire.php';
//
//Load the mappings to a database
$q = new \mutall\questionnaire("tracker_mogaka_new");

$tname1 = 'contributions';

//The sql to get data for the contributions table
$contribution_sql = '
select 
    presentation.date as presentation_date,

    contribution.num as contribution_num,
    contribution.detail as contribution_detail,
    contribution.summary as contribution_summary,
    contributor.surname as intern_surname_contributor,
   
    minute.num as minute_num,
    minute.detail as minute_detail,
    minute.summary as minute_summary,
    
        activity.activity as activity_activity,
        activity.summary as activity_summary,

            project.summary as project_summary,
            project.project as project_project,

                workplan.year as workplan_year,

                    intern.surname as intern_surname_owner
from 
    activity
    inner join project on activity.project = project.project
    inner join workplan on project.workplan = workplan.workplan
    inner join intern on workplan.intern = intern.intern
    inner join presentation on presentation.intern = intern.intern 
    inner join minute on minute.presentation=presentation.presentation 
        and minute.activity = activity.activity 
    inner join contribution on contribution.`minute` = `minute`.`minute`
    inner join intern as contributor on contribution.intern = contributor.intern
';

//The contribuitons table
$contributions = new query(
        //
        //The name of the text table    
        $tname1,
        //
        //The sql statement to get the data
        $contribution_sql,
        //
        //The dbase to execute the query aganist
        'tracker_mogaka'
);

$fn = '\mutall\capture\lookup';

// $exp = new lookup($tname, 'intern');
//
//Map data from a csv file to a the database
$layout = [
    $contributions,
    [[$fn, $tname1, 'contribution_num'], "contribution", "num",['contributor']],
    [[$fn, $tname1, 'contribution_summary'], "contribution", "summary",['contributor']],
    [[$fn, $tname1, 'contribution_details'], "contribution", "detail",['contributor']],
    [[$fn, $tname1, 'minute_num'], "minute", "num"],
    [[$fn, $tname1, 'minute_summary'], "minute", "summary"],
    [[$fn, $tname1, 'minute_detail'], "minute", "detail"],
    [[$fn, $tname1, 'presentation_date'], "presentation", "date"],
    [[$fn, $tname1, 'activity_summary'], "activity", "summary"],
    [[$fn, $tname1, 'project_summary'], "project", "summary"],
    [[$fn, $tname1, 'workplan_year'], "workplan", "year"],
    
    [[$fn, $tname1, 'intern_surname_owner'], "intern", "surname"],
    [[$fn, $tname1, 'intern_surname_contributor'], "intern", "surname",['contributor']],
];
//
//Load the data using the most common method
$result = $q -> load_common($layout);
//
//print the result
echo $result;
