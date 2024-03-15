<?php
namespace mutall\capture;

include '../../../schema/v/code/schema.php';
include '../../../schema/v/code/questionnaire.php';
//
//Load the mappings to a database
$q = new \mutall\questionnaire("tracker_mogaka_new");

$tname = 'minutes';

//sql that will construct the minutes table
$minutes_sql = '
select 
    presentation.date as presentation_date,

    minute.num as minute_num,
    minute.detail as minute_detail,
    minute.summary as minute_summary,

        activity.activity as activity_activity,
        activity.summary as activity_summary,

            project.summary as project_summary,
            project.project as project_project,

                workplan.year as workplan_year,

                    intern.surname as intern_surname
from 
    activity
    inner join project on activity.project = project.project
    inner join workplan on project.workplan = workplan.workplan
    inner join intern on workplan.intern = intern.intern
    inner join presentation on presentation.intern = intern.intern 
    inner join minute on minute.presentation=presentation.presentation 
        and minute.activity = activity.activity ';

//The minutes table
$minutes = new query(
        //
        //The name of the text table    
        $tname,
        //
        //The sql statement to get the data
        $minutes_sql,
        //
        //The dbase to execute the query aganist
        'tracker_mogaka'
);

$fn = '\mutall\capture\lookup';

// $exp = new lookup($tname, $fname);
//
//Map data from an sql statement to the database
$layout = [
    $minutes,
    [[$fn, $tname, 'minute_num'], "minute", "num"],
    [[$fn, $tname, 'minute_summary'], "minute", "summary"],
    [[$fn, $tname, 'minute_detail'], "minute", "detail"],
    [[$fn, $tname, 'presentation_date'], "presentation", "date"],
    [[$fn, $tname, 'activity_summary'], "activity", "summary"],
    [[$fn, $tname, 'project_summary'], "project", "summary"],
    [[$fn, $tname, 'workplan_year'], "workplan", "year"],
    [[$fn, $tname, 'intern_surname'], "intern", "surname"]
];
//
//Load the data using the most common method
$result = $q -> load_common($layout);
//
//print the result
echo $result;
