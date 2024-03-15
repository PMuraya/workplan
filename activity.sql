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
        and minute.activity = activity.activity